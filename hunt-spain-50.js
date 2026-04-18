// Caza 50 negocios en TODA ESPAÑA: sin web, con email, no duplicados con CRM
const https = require('https');
const fs = require('fs');

const API_KEY = 'AIzaSyAsxB_Gpi_QyD3j84uohYaK6ftyuyj0U-g';
const OUT = __dirname;
const TARGET = 50;

// Sectores donde más probable email público
const SECTORES = [
  'inmobiliaria', 'asesoria fiscal', 'gestoria', 'abogado',
  'clinica dental', 'veterinaria', 'fisioterapia', 'optica',
  'academia', 'autoescuela', 'psicologo', 'centro estetica',
  'peluqueria', 'taller mecanico', 'floristeria'
];

// Top 30 ciudades España
const CIUDADES = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
  'Malaga', 'Murcia', 'Palma de Mallorca', 'Las Palmas', 'Bilbao',
  'Alicante', 'Cordoba', 'Valladolid', 'Vigo', 'Gijon',
  'L\'Hospitalet', 'A Coruña', 'Vitoria', 'Granada', 'Elche',
  'Oviedo', 'Santa Cruz de Tenerife', 'Badalona', 'Cartagena', 'Terrassa',
  'Jerez', 'Sabadell', 'Mostoles', 'Alcala de Henares', 'Pamplona'
];

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
];
const pickUA = () => UA_LIST[Math.floor(Math.random() * UA_LIST.length)];

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

function httpGet(hostname, path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname, path, method: 'GET',
      headers: {
        'User-Agent': pickUA(),
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept-Encoding': 'identity'
      }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({status: res.statusCode, body: d}));
    });
    req.on('error', e => resolve({error: e.message}));
    req.end();
  });
}

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
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.location,places.googleMapsUri',
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
}

function extractEmails(html) {
  if (!html) return [];
  html = html.replace(/&#64;/g,'@').replace(/&#46;/g,'.').replace(/\[at\]/gi,'@').replace(/\[dot\]/gi,'.').replace(/\s+@\s+/g,'@');
  const rx = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}/g;
  const all = html.match(rx) || [];
  return all.filter(e => {
    const low = e.toLowerCase();
    return !/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/.test(low) &&
           !low.includes('sentry') && !low.includes('google.com') && !low.includes('gstatic') &&
           !low.includes('example.com') && !low.includes('sample') && !low.includes('test@') &&
           !low.includes('localhost') && !low.includes('noreply') && !low.includes('no-reply') &&
           !low.includes('mycompany') && !low.includes('domain.com') && !low.includes('yourname') &&
           !low.includes('wikipedia') && !low.includes('wixpress') && !low.includes('microsoft') &&
           !low.includes('bing.com') && !low.includes('yahoo.net') && !low.includes('apple.com') &&
           !low.includes('facebook.com') && !low.includes('instagram.com') &&
           e.length < 60 && e.length > 7;
  });
}

function pickBestEmail(emails, name) {
  if (!emails.length) return null;
  const uniq = [...new Set(emails.map(e => e.toLowerCase()))];
  const nw = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(w => w.length > 3);
  uniq.sort((a,b) => {
    const sa = nw.some(w => a.includes(w)) ? 10 : 0;
    const sb = nw.some(w => b.includes(w)) ? 10 : 0;
    const ga = /gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|live\.com|yahoo\.es/.test(a) ? -3 : 0;
    const gb = /gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|live\.com|yahoo\.es/.test(b) ? -3 : 0;
    return (sb+gb)-(sa+ga);
  });
  return uniq[0];
}

async function findEmailBing(name, city) {
  const q = `"${name}" ${city} email contacto`;
  const r = await httpGet('www.bing.com', '/search?q=' + encodeURIComponent(q) + '&cc=es');
  if (!r.body) return null;
  return pickBestEmail(extractEmails(r.body), name);
}
async function findEmailGoogle(name, city) {
  const q = `"${name}" ${city} @`;
  const r = await httpGet('www.google.com', '/search?q=' + encodeURIComponent(q) + '&hl=es&gl=es&num=15');
  if (!r.body) return null;
  return pickBestEmail(extractEmails(r.body), name);
}

async function loadCRMNames() {
  const all = JSON.parse(fs.readFileSync(OUT + '/all-leads.json', 'utf8'));
  const s = new Set();
  all.forEach(l => {
    const k = (l.nombre||'').toLowerCase().trim().replace(/\s+/g,' ');
    if (k) s.add(k);
  });
  return s;
}

(async () => {
  const crmNames = await loadCRMNames();
  console.log(`CRM: ${crmNames.size} nombres únicos para dedup.`);
  console.log(`Objetivo: ${TARGET} leads con email.\n`);

  const candidates = [];
  const seenIds = new Set();
  const withEmail = [];

  // Mezcla aleatoria para variedad
  const pairs = [];
  for (const c of CIUDADES) for (const s of SECTORES) pairs.push({ciudad: c, sector: s});
  pairs.sort(() => Math.random() - 0.5);

  console.log('=== SCRAPEANDO Y BUSCANDO EMAIL EN PARALELO ===\n');

  for (let pi = 0; pi < pairs.length && withEmail.length < TARGET; pi++) {
    const {ciudad, sector} = pairs[pi];
    const r = await placesSearch(`${sector} ${ciudad}`);
    if (!r.json || !r.json.places) continue;
    const places = r.json.places;

    let newInBatch = 0;
    for (const p of places) {
      if (withEmail.length >= TARGET) break;
      if (seenIds.has(p.id)) continue;
      if (p.websiteUri) continue;
      const name = p.displayName?.text || '';
      const key = name.toLowerCase().trim().replace(/\s+/g,' ');
      if (!name || crmNames.has(key)) continue;
      seenIds.add(p.id);
      newInBatch++;

      const candidate = {
        place_id: p.id,
        nombre: name,
        direccion: p.formattedAddress || '',
        telefono: p.nationalPhoneNumber || '',
        rating: p.rating || null,
        reviews: p.userRatingCount || 0,
        ciudad, sector,
        google_maps_url: p.googleMapsUri || '',
        lat: p.location?.latitude, lng: p.location?.longitude
      };
      candidates.push(candidate);

      // Buscar email
      let email = await findEmailBing(name, ciudad);
      let source = 'bing';
      if (!email) {
        await new Promise(r => setTimeout(r, 250));
        email = await findEmailGoogle(name, ciudad);
        source = 'google';
      }
      if (email) {
        candidate.email = email;
        candidate.email_source = source;
        withEmail.push(candidate);
        console.log(`  ✅ [${withEmail.length}/${TARGET}] ${name.slice(0,42).padEnd(42)} → ${email}  (${source}, ${ciudad})`);
        fs.writeFileSync(OUT + '/candidates-spain-50.json', JSON.stringify(withEmail, null, 2));
      }
      await new Promise(r => setTimeout(r, 350));
    }
    if (pi % 10 === 0 && pi > 0) console.log(`  [queries: ${pi}/${pairs.length}] candidatos: ${candidates.length}, con email: ${withEmail.length}`);
  }

  console.log(`\n🎯 ${withEmail.length} leads con email guardados en candidates-spain-50.json`);
  if (withEmail.length > 0) {
    const bySector = {};
    const byCity = {};
    withEmail.forEach(c => {
      bySector[c.sector] = (bySector[c.sector]||0)+1;
      byCity[c.ciudad] = (byCity[c.ciudad]||0)+1;
    });
    console.log('Sectores:', JSON.stringify(bySector));
    console.log('Ciudades:', JSON.stringify(byCity));
  }
})();
