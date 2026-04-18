// Caza 50 negocios en Bizkaia: sin web, con email, no duplicados con CRM
const https = require('https');
const fs = require('fs');

const API_KEY = 'AIzaSyAsxB_Gpi_QyD3j84uohYaK6ftyuyj0U-g';
const OUT = __dirname;

// Sectores donde es más probable que haya email
const SECTORES = [
  'inmobiliaria', 'asesoria', 'gestoria', 'clinica dental', 'veterinaria',
  'fisioterapia', 'optica', 'autoescuela', 'academia', 'abogado',
  'podologo', 'psicologo', 'centro estetica', 'peluqueria', 'barberia',
  'taller mecanico', 'cerrajeria', 'fontanero', 'ferreteria', 'floristeria',
  'panaderia', 'pasteleria', 'restaurante', 'bar', 'cafeteria'
];

// Ciudades Bizkaia por tamaño
const CIUDADES = [
  'Bilbao', 'Barakaldo', 'Getxo', 'Portugalete', 'Santurtzi',
  'Basauri', 'Leioa', 'Sestao', 'Galdakao', 'Durango',
  'Erandio', 'Amorebieta', 'Mungia', 'Sopelana', 'Bermeo',
  'Gernika', 'Arrigorriaga', 'Zalla', 'Ermua', 'Balmaseda'
];

function httpsReq(options, body) {
  return new Promise((resolve) => {
    const req = https.request(options, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve({status: res.statusCode, json: JSON.parse(d)}); }
        catch(e) { resolve({status: res.statusCode, text: d}); }
      });
    });
    req.on('error', e => resolve({error: e.message}));
    if (body) req.write(body);
    req.end();
  });
}

// 1. Places API Text Search
async function placesSearch(query) {
  const body = JSON.stringify({
    textQuery: query + ' España',
    maxResultCount: 20,
    languageCode: 'es',
    regionCode: 'ES'
  });
  return httpsReq({
    hostname: 'places.googleapis.com',
    path: '/v1/places:searchText',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.location,places.googleMapsUri',
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
}

// 2. WebSearch via Google Custom Search (usamos scraping simple de DuckDuckGo HTML — sin rate limit duro)
async function searchEmailFor(name, city) {
  const query = `"${name}" "${city}" email contacto`;
  const url = '/html/?q=' + encodeURIComponent(query);
  const r = await httpsReq({
    hostname: 'duckduckgo.com',
    path: url,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  if (!r.text) return null;
  const emails = r.text.match(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/g) || [];
  // Filtrar spam emails y dominios malos
  const ok = emails.filter(e => {
    const low = e.toLowerCase();
    return !low.includes('duckduckgo') && !low.includes('sentry') && !low.includes('noreply') &&
           !low.includes('example') && !low.endsWith('.png') && !low.endsWith('.jpg') &&
           !low.includes('privacy') && !low.includes('support@');
  });
  return ok.length ? ok[0] : null;
}

// 3. CRM leads existentes para dedup
async function loadCRMNames() {
  const all = JSON.parse(fs.readFileSync(OUT + '/all-leads.json', 'utf8'));
  const set = new Set();
  all.forEach(l => {
    const k = (l.nombre||'').toLowerCase().trim().replace(/\s+/g,' ');
    if (k) set.add(k);
  });
  console.log('CRM loaded:', set.size, 'unique names');
  return set;
}

// Main
(async () => {
  const crmNames = await loadCRMNames();
  const candidates = [];
  const seenPlaceIds = new Set();

  console.log('\n=== FASE 1: Scraping Places API ===\n');

  // Mezclar pares sector+ciudad y lanzar queries
  outer:
  for (const ciudad of CIUDADES) {
    for (const sector of SECTORES) {
      if (candidates.length >= 300) break outer;
      const query = `${sector} ${ciudad}`;
      const r = await placesSearch(query);
      if (!r.json || !r.json.places) {
        console.log('  ⚠️ ' + query + ' → ' + (r.json && r.json.error ? r.json.error.message : 'no places'));
        continue;
      }
      const found = r.json.places || [];
      let addedThis = 0;
      for (const p of found) {
        if (seenPlaceIds.has(p.id)) continue;
        if (p.websiteUri) continue; // ya tiene web
        const name = p.displayName?.text || '';
        const key = name.toLowerCase().trim().replace(/\s+/g,' ');
        if (!name || crmNames.has(key)) continue;
        seenPlaceIds.add(p.id);
        candidates.push({
          place_id: p.id,
          nombre: name,
          direccion: p.formattedAddress || '',
          telefono: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
          rating: p.rating || null,
          reviews: p.userRatingCount || 0,
          tipos: p.types || [],
          ciudad: ciudad,
          sector: sector,
          google_maps_url: p.googleMapsUri || '',
          lat: p.location?.latitude || null,
          lng: p.location?.longitude || null
        });
        addedThis++;
      }
      console.log(`  ${query} → ${found.length} places, ${addedThis} nuevos sin web (total: ${candidates.length})`);
    }
  }

  fs.writeFileSync(OUT + '/candidates-raw.json', JSON.stringify(candidates, null, 2));
  console.log(`\n✅ ${candidates.length} candidatos SIN web (no en CRM) guardados en candidates-raw.json`);

  // Fase 2: buscar email para cada uno
  console.log('\n=== FASE 2: Buscando email para cada candidato ===\n');
  const withEmail = [];
  for (let i = 0; i < candidates.length && withEmail.length < 50; i++) {
    const c = candidates[i];
    try {
      const email = await searchEmailFor(c.nombre, c.ciudad);
      if (email) {
        c.email = email;
        withEmail.push(c);
        console.log(`  ✅ [${withEmail.length}/50] ${c.nombre} → ${email}`);
      } else {
        process.stdout.write(`  ${i+1}/${candidates.length} ${c.nombre.slice(0,40)} — sin email\r`);
      }
    } catch(e) { console.log('  ERROR ' + c.nombre + ': ' + e.message); }
    await new Promise(r => setTimeout(r, 400)); // throttle
  }

  fs.writeFileSync(OUT + '/candidates-50-with-email.json', JSON.stringify(withEmail, null, 2));
  console.log(`\n\n🎉 ${withEmail.length} leads con email guardados en candidates-50-with-email.json`);
  console.log('\nSectores:', [...new Set(withEmail.map(c => c.sector))].join(', '));
  console.log('Ciudades:', [...new Set(withEmail.map(c => c.ciudad))].join(', '));
})();
