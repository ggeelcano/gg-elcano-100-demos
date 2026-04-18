// Pipeline completo: Places API → 100 nuevos con móvil → CRM → demos → campaña
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyAsxB_Gpi_QyD3j84uohYaK6ftyuyj0U-g';
const TOKEN = fs.readFileSync('.token','utf8').trim();
const TARGET = 100;

const SECTORES = [
  'inmobiliaria', 'asesoria fiscal', 'gestoria', 'abogado',
  'clinica dental', 'veterinaria', 'fisioterapia', 'optica',
  'academia', 'autoescuela', 'psicologo', 'centro estetica',
  'peluqueria', 'barberia', 'taller mecanico', 'cerrajeria',
  'fontanero', 'ferreteria', 'floristeria', 'panaderia',
  'pasteleria', 'restaurante', 'bar', 'cafeteria', 'podologo'
];

// Ciudades Bizkaia ampliadas
const CIUDADES = [
  'Bilbao', 'Barakaldo', 'Getxo', 'Portugalete', 'Santurtzi',
  'Basauri', 'Leioa', 'Sestao', 'Durango', 'Erandio',
  'Amorebieta', 'Mungia', 'Sopelana', 'Bermeo', 'Gernika',
  'Arrigorriaga', 'Ermua', 'Algorta', 'Las Arenas'
];

const sectorMap = {
  'asesoria fiscal': 'abogado-gestoria', 'gestoria': 'abogado-gestoria', 'abogado': 'abogado-gestoria', 'asesoria': 'abogado-gestoria',
  'clinica dental': 'clinica-dental',
  'veterinaria': 'veterinaria', 'fisioterapia': 'fisioterapia', 'optica': 'optica',
  'academia': 'academia', 'autoescuela': 'autoescuela',
  'psicologo': 'psicologia', 'podologo': 'podologia',
  'centro estetica': 'centro-estetica', 'peluqueria': 'peluqueria', 'barberia': 'barberia',
  'taller mecanico': 'taller-mecanico', 'cerrajeria': 'cerrajeria', 'fontanero': 'fontaneria',
  'ferreteria': 'ferreteria', 'floristeria': 'floristeria',
  'panaderia': 'pasteleria-panaderia', 'pasteleria': 'pasteleria-panaderia',
  'restaurante': 'restaurante', 'bar': 'bar-de-tapas', 'cafeteria': 'cafeteria'
};

function httpsReq(opts, body) {
  return new Promise(resolve => {
    const req = https.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{resolve({status:res.statusCode,json:JSON.parse(d)});}catch{resolve({status:res.statusCode,text:d.slice(0,300)});}});});
    req.on('error', e => resolve({error:e.message}));
    if(body) req.write(body);
    req.end();
  });
}

async function placesSearch(query) {
  const body = JSON.stringify({ textQuery: query + ' España', maxResultCount: 20, languageCode:'es', regionCode:'ES' });
  return httpsReq({
    hostname:'places.googleapis.com', path:'/v1/places:searchText', method:'POST',
    headers:{'Content-Type':'application/json','X-Goog-Api-Key':API_KEY,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.location,places.googleMapsUri','Content-Length':Buffer.byteLength(body)}
  }, body);
}

function isMobile(t) { if(!t) return false; const c=t.toString().replace(/\D/g,'').replace(/^34/,''); return /^[67]/.test(c); }

async function loadCRMSet() {
  // Descargar todos los leads
  let all = [];
  for (let off = 0; off < 5000; off += 200) {
    const r = await new Promise(res => https.get({hostname:'gg-crm.ggelcano.workers.dev',path:'/api/leads?limit=200&offset='+off,headers:{'Authorization':'Bearer '+TOKEN}},rs => {let d='';rs.on('data',c=>d+=c);rs.on('end',()=>{try{res(JSON.parse(d));}catch{res({leads:[]});}});}));
    const ls = r.leads || [];
    if (!ls.length) break;
    all = all.concat(ls);
    if (ls.length < 200) break;
  }
  console.log('CRM actual:', all.length, 'leads');
  const nameSet = new Set();
  const placeSet = new Set();
  all.forEach(l => {
    const k = (l.nombre||'').toLowerCase().trim().replace(/\s+/g,' ');
    if (k) nameSet.add(k);
    if (l.place_id) placeSet.add(l.place_id);
  });
  return { nameSet, placeSet };
}

async function upsertLead(lead) {
  const sectorTpl = sectorMap[lead.sector] || 'abogado-gestoria';
  const body = JSON.stringify({
    nombre: lead.nombre,
    sector: sectorTpl,
    descripcion: 'Sector: '+lead.sector+'. Rating Google: '+(lead.rating||'—')+' ('+(lead.reviews||0)+' reseñas)',
    direccion: lead.direccion, ciudad: lead.ciudad, provincia: 'Bizkaia',
    place_id: lead.place_id, google_maps_url: lead.google_maps_url,
    telefono: lead.telefono,
    google_rating: lead.rating, google_reviews: lead.reviews,
    tiene_web: 0, estado: 'LEAD', prioridad: 'alta',
    fuente: 'Places API 2026-04-18 batch4'
  });
  return new Promise(r => {
    const req = https.request({hostname:'gg-crm.ggelcano.workers.dev',path:'/api/leads',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN,'Content-Length':Buffer.byteLength(body)}},res => {let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{r({status:res.statusCode,json:JSON.parse(d)});}catch{r({status:res.statusCode,text:d.slice(0,200)});}});});
    req.on('error',e=>r({error:e.message}));
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('\n=== FASE 1: Cargar CRM para dedup ===');
  const { nameSet, placeSet } = await loadCRMSet();
  console.log('Nombres únicos:', nameSet.size, '| place_ids:', placeSet.size);

  console.log('\n=== FASE 2: Scrape Places API (Bizkaia ampliado) ===');
  const candidates = [];
  const seenIds = new Set();
  const pairs = [];
  for (const c of CIUDADES) for (const s of SECTORES) pairs.push({ciudad:c, sector:s});
  pairs.sort(() => Math.random()-0.5);

  for (let pi = 0; pi < pairs.length; pi++) {
    const {ciudad, sector} = pairs[pi];
    const r = await placesSearch(`${sector} ${ciudad}`);
    if (!r.json || !r.json.places) {
      if (pi % 30 === 0) console.log(`  [${pi}/${pairs.length}] candidatos sin web+móvil: ${candidates.length}`);
      continue;
    }
    let newInBatch = 0;
    for (const p of r.json.places) {
      if (seenIds.has(p.id)) continue;
      if (placeSet.has(p.id)) continue;
      if (p.websiteUri) continue;
      if (!isMobile(p.nationalPhoneNumber)) continue;
      const name = p.displayName?.text || '';
      const key = name.toLowerCase().trim().replace(/\s+/g,' ');
      if (!name || nameSet.has(key)) continue;
      seenIds.add(p.id);
      candidates.push({
        place_id: p.id, nombre: name,
        direccion: p.formattedAddress||'',
        telefono: p.nationalPhoneNumber||'',
        rating: p.rating||null, reviews: p.userRatingCount||0,
        ciudad, sector,
        google_maps_url: p.googleMapsUri||'',
        lat: p.location?.latitude, lng: p.location?.longitude,
        sector_tpl: sectorMap[sector] || 'abogado-gestoria'
      });
      newInBatch++;
    }
    if (newInBatch > 0 || pi % 20 === 0) {
      console.log(`  [${pi+1}/${pairs.length}] ${sector}@${ciudad}: +${newInBatch} (total ${candidates.length})`);
    }
    // Si ya tenemos +300 paramos, suficiente para filtrar 100
    if (candidates.length >= 300) { console.log('  ⏸️ Stop early con', candidates.length, 'candidatos'); break; }
  }

  fs.writeFileSync('candidates-100-raw.json', JSON.stringify(candidates, null, 2));
  console.log(`\n✅ ${candidates.length} candidatos sin web + con móvil + no en CRM`);

  // Top 100 por calidad
  candidates.sort((a,b) => (b.rating||3)*Math.log((b.reviews||1)+1) - (a.rating||3)*Math.log((a.reviews||1)+1));
  const top100 = candidates.slice(0, TARGET);
  fs.writeFileSync('candidates-100.json', JSON.stringify({leads: top100}, null, 2));
  console.log('Top', TARGET, 'seleccionados');
  const bySec = {}, byCity = {};
  top100.forEach(c => { bySec[c.sector]=(bySec[c.sector]||0)+1; byCity[c.ciudad]=(byCity[c.ciudad]||0)+1; });
  console.log('Sectores:', JSON.stringify(bySec));
  console.log('Ciudades:', JSON.stringify(byCity));

  console.log('\n=== FASE 3: Upsert 100 al CRM ===');
  let ok=0, fail=0;
  for (const l of top100) {
    const r = await upsertLead(l);
    if (r.status && r.status<300) ok++; else fail++;
  }
  console.log('Upsert:', ok, '/', top100.length, '(fail:', fail+')');

  console.log('\n=== FASE 4: Done. Next: regen-v2 script pointing to candidates-100.json ===');
})();
