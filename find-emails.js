// Toma candidates-raw.json y busca email en Bing/Google usando HTML scraping
const https = require('https');
const fs = require('fs');

const OUT = __dirname;
const candidates = JSON.parse(fs.readFileSync(OUT + '/candidates-raw.json', 'utf8'));
console.log('Cargados', candidates.length, 'candidatos. Objetivo: 50 con email válido.\n');

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];
const pickUA = () => UA_LIST[Math.floor(Math.random() * UA_LIST.length)];

function httpGet(hostname, path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname, path, method: 'GET',
      headers: {
        'User-Agent': pickUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'identity'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({status: res.statusCode, body: d}));
    });
    req.on('error', e => resolve({error: e.message}));
    req.end();
  });
}

function extractEmails(html) {
  if (!html) return [];
  // Decodificar entidades básicas
  html = html.replace(/&#64;/g, '@').replace(/&#46;/g, '.').replace(/\[at\]/gi, '@').replace(/\[dot\]/gi, '.').replace(/\s+@\s+/g, '@');
  const rx = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const all = html.match(rx) || [];
  return all.filter(e => {
    const low = e.toLowerCase();
    return !low.endsWith('.png') && !low.endsWith('.jpg') && !low.endsWith('.gif') && !low.endsWith('.svg') &&
           !low.endsWith('.css') && !low.endsWith('.js') && !low.endsWith('.webp') &&
           !low.includes('sentry') && !low.includes('google.com') && !low.includes('gstatic') &&
           !low.includes('example.com') && !low.includes('sample.com') && !low.includes('test.com') &&
           !low.includes('localhost') && !low.includes('email@') && !low.includes('noreply') &&
           !low.includes('no-reply') && !low.includes('mycompany') && !low.includes('domain.com') &&
           !low.includes('yourname') && !low.includes('wikipedia') && !low.includes('wixpress') &&
           !low.startsWith('sentry') && e.length < 60;
  });
}

function pickBestEmail(emails, name) {
  if (!emails.length) return null;
  const uniq = [...new Set(emails.map(e => e.toLowerCase()))];
  // Score: preferir el que comparte palabras con el nombre
  const nameWords = name.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(w => w.length > 3);
  uniq.sort((a,b) => {
    const scoreA = nameWords.some(w => a.includes(w)) ? 10 : 0;
    const scoreB = nameWords.some(w => b.includes(w)) ? 10 : 0;
    // Penalizar genéricos tipo gmail/hotmail/yahoo si hay alternativa con dominio propio
    const genA = /gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|live\.com/.test(a) ? -3 : 0;
    const genB = /gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|live\.com/.test(b) ? -3 : 0;
    return (scoreB + genB) - (scoreA + genA);
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
  const q = `"${name}" ${city} email`;
  const r = await httpGet('www.google.com', '/search?q=' + encodeURIComponent(q) + '&hl=es&gl=es&num=15');
  if (!r.body) return null;
  return pickBestEmail(extractEmails(r.body), name);
}

async function findEmailStartpage(name, city) {
  const q = `${name} ${city} email contacto`;
  const r = await httpGet('www.startpage.com', '/do/search?q=' + encodeURIComponent(q));
  if (!r.body) return null;
  return pickBestEmail(extractEmails(r.body), name);
}

async function findAnyEmail(c) {
  // Intentar Bing primero (menos bloqueos)
  let email = await findEmailBing(c.nombre, c.ciudad);
  if (email) return {email, source: 'bing'};
  await new Promise(r => setTimeout(r, 300));
  email = await findEmailGoogle(c.nombre, c.ciudad);
  if (email) return {email, source: 'google'};
  return null;
}

(async () => {
  const withEmail = [];
  const TARGET = 50;
  let bing_fails = 0;

  for (let i = 0; i < candidates.length && withEmail.length < TARGET; i++) {
    const c = candidates[i];
    try {
      const res = await findAnyEmail(c);
      if (res && res.email) {
        c.email = res.email;
        c.email_source = res.source;
        withEmail.push(c);
        console.log(`  ✅ [${withEmail.length}/${TARGET}] (${i+1}/${candidates.length}) ${c.nombre.slice(0,40).padEnd(40)} → ${res.email} [${res.source}]`);
        fs.writeFileSync(OUT + '/candidates-50-with-email.json', JSON.stringify(withEmail, null, 2));
      } else {
        if (i % 20 === 0) console.log(`  ${i+1}/${candidates.length} scaneados, ${withEmail.length} con email hasta ahora`);
      }
    } catch(e) {
      console.log('  ERR', c.nombre, e.message);
    }
    await new Promise(r => setTimeout(r, 400 + Math.random()*300));
  }

  console.log(`\n🎯 Resultado: ${withEmail.length} leads con email`);
  if (withEmail.length > 0) {
    const bySector = {};
    withEmail.forEach(c => bySector[c.sector] = (bySector[c.sector]||0)+1);
    console.log('Sectores:', JSON.stringify(bySector));
    console.log('Ciudades:', [...new Set(withEmail.map(c => c.ciudad))].join(', '));
    console.log('Dominios email:', [...new Set(withEmail.map(c => c.email.split('@')[1]))].slice(0,10).join(', '));
  }
})();
