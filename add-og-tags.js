// Añade Open Graph tags a todas las demos de un directorio
// Uso: node add-og-tags.js demos-v4  (o demos-v5)
const fs = require('fs');
const path = require('path');

const DIR = process.argv[2] || 'demos-v5';
const catalog = JSON.parse(fs.readFileSync(path.join(DIR, 'catalog.json'), 'utf8'));
const BASE_URL = 'https://ggeelcano.github.io/gg-elcano-100-demos/' + DIR + '/';

const SECTOR_LABEL = {
  'peluqueria':'Peluquería','barberia':'Barbería','centro-estetica':'Centro de estética',
  'centro-unas':'Centro de uñas','spa-masajes':'Spa','fisioterapia':'Clínica de fisioterapia',
  'podologia':'Podología','psicologia':'Consulta de psicología','pilates-yoga':'Pilates/Yoga',
  'gimnasio':'Gimnasio','crossfit':'CrossFit','artes-marciales':'Artes marciales',
  'optica':'Óptica','clinica-dental':'Clínica dental','veterinaria':'Clínica veterinaria',
  'tienda-mascotas':'Tienda de mascotas','floristeria':'Floristería','ferreteria':'Ferretería',
  'pasteleria-panaderia':'Panadería y pastelería','pizzeria':'Pizzería','kebab':'Kebab',
  'japones-sushi':'Restaurante japonés','cerveceria':'Cervecería','asador':'Asador',
  'restaurante':'Restaurante','bar-de-tapas':'Bar de tapas','cafeteria':'Cafetería',
  'food-truck':'Food truck','taller-bicicletas':'Taller de bicicletas','taller-mecanico':'Taller mecánico',
  'cerrajeria':'Cerrajería','fontaneria':'Fontanería','abogado-gestoria':'Despacho profesional',
  'autoescuela':'Autoescuela','academia':'Academia','fotografia':'Estudio de fotografía',
  'inmobiliaria':'Inmobiliaria','taller-costura':'Taller de costura',
  'tienda-informatica':'Tienda de informática','tienda-ropa':'Tienda de moda'
};

function buildOgTags(item) {
  const name = item.nombre;
  const sectorKey = item.sector_tpl || item.sector || '';
  const sectorLabel = SECTOR_LABEL[sectorKey] || 'Negocio local';
  const ciudad = item.ciudad || 'Bizkaia';
  const rating = item.rating || (item.google_rating > 0 ? item.google_rating : null);
  const url = BASE_URL + item.slug + '/';

  const title = `${name} — ${sectorLabel}`;
  let desc = `${name} — ${sectorLabel.toLowerCase()} en ${ciudad}`;
  if (rating) desc += `. ${rating}⭐ en Google`;
  desc += '.';

  return { title, desc, url };
}

const files = fs.readdirSync(DIR).filter(f => fs.statSync(path.join(DIR, f)).isDirectory());
console.log(`Procesando ${files.length} demos en ${DIR}/...`);

let ok = 0, fail = 0;
for (const slug of files) {
  const item = catalog.find(c => c.slug === slug);
  if (!item) { console.log('  sin catalog:', slug); fail++; continue; }

  const htmlPath = path.join(DIR, slug, 'index.html');
  if (!fs.existsSync(htmlPath)) { fail++; continue; }

  let html = fs.readFileSync(htmlPath, 'utf8');
  const { title, desc, url } = buildOgTags(item);

  // Remove existing OG tags
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*\/?>\s*/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*\/?>\s*/gi, '');

  // Update <title> too
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  // Escape HTML entities in content
  const esc = s => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const ogBlock = `
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="G&amp;G Elcano"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(desc)}"/>
  <meta property="og:url" content="${esc(url)}"/>
  <meta property="og:locale" content="es_ES"/>
  <meta name="twitter:card" content="summary"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(desc)}"/>`;

  // Insert OG tags after first <meta> tag or right after <head>
  if (/<meta\s+http-equiv="Cache-Control"/i.test(html)) {
    html = html.replace(/(<meta\s+http-equiv="Cache-Control"[^>]*\/?>)/i, '$1' + ogBlock);
  } else {
    html = html.replace(/<head>/i, '<head>' + ogBlock);
  }

  fs.writeFileSync(htmlPath, html);
  ok++;
}

console.log(`\n✅ OG tags añadidos: ${ok}/${files.length} fail=${fail}`);
