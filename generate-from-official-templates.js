// Genera 50 demos personalizando las plantillas oficiales de GGElcano/demos
const fs = require('fs');
const path = require('path');

const leads = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidates-50-whatsapp.json'), 'utf8')).leads;
const TPL_DIR = path.join(__dirname, 'tpls');
const OUT_DIR = path.join(__dirname, 'demos-oficiales');
fs.mkdirSync(OUT_DIR, { recursive: true });

const slugify = s => (s||'').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0, 60);

// Stats por sector: calculamos valores realistas para los 4 stats que aparecen en plantillas
function genStats(lead) {
  const years = Math.floor(3 + Math.random() * 15); // años
  return {
    años: years,
    clientes: lead.reviews ? lead.reviews * (5 + Math.floor(Math.random()*10)) : 500 + Math.floor(Math.random()*2000),
    rating: lead.rating || 4.6,
    reseñas: lead.reviews || 50
  };
}

function personalize(html, lead) {
  const name = lead.nombre || 'Tu Negocio';
  const tel = lead.telefono || '';
  const telClean = tel.replace(/\s/g,'');
  const city = lead.ciudad || 'España';
  const addr = lead.direccion || city;
  const rating = lead.rating || 4.7;
  const reviews = lead.reviews || 0;
  const stats = genStats(lead);

  // 1. Placeholders explícitos
  let out = html
    .replace(/\[Nombre del Negocio\]/g, name)
    .replace(/\[Tu Dirección Completa\]/g, addr)
    .replace(/\[tu@email\.com\]/g, 'info@ggelcano.com')
    .replace(/\[TELEFONO\]/g, tel);

  // 2. Stats comunes "5+ Años" "500+ Clientes" "4.7 Rating" "150 Reseñas"
  // Patrón: número seguido de texto corto (buscar en el HTML de la plantilla)
  // Reemplazar el número del rating con el rating real
  out = out.replace(/>(\s*4\.[5-9])(\s*)</g, '>'+rating+'$2<');
  out = out.replace(/>(\s*4\.9\s*)\/5/g, '>'+rating+' /5');

  // 3. Título hero: las plantillas tienen "Color · Corte · Estilo" o similar - los dejamos del sector
  // pero cambiamos mentions "Salón Mía" / "Peluquería X" del copy → nombre real cuando aparezca
  // Nota: El CSS/JS NO se toca

  // 4. Añadir badge "Demo creada por G&G Elcano"
  const badge = `<div style="position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,0.9);color:#fff;padding:10px 18px;border-radius:24px;font-family:'Inter',sans-serif;font-size:12px;z-index:99999;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,0.3)"><span style="width:8px;height:8px;background:#ff3d00;border-radius:50%;animation:pulse 2s infinite"></span>Demo de <a href="https://github.com/ggeelcano" style="color:#ff6b3d;text-decoration:none;font-weight:600">G&G Elcano</a></div>`;
  out = out.replace('</body>', badge + '</body>');

  // 5. Teléfono: añadir botones de contacto flotantes (WhatsApp + llamar)
  if (tel) {
    const isMobile = /^[67]/.test(telClean.replace(/^34/,''));
    const waNum = isMobile ? ('34' + telClean.replace(/^34/,'')) : '';
    const floatBtns = `
<div style="position:fixed;bottom:20px;left:20px;display:flex;flex-direction:column;gap:10px;z-index:99999">
${waNum ? `<a href="https://wa.me/${waNum}?text=Hola%2C%20vengo%20de%20vuestra%20web" target="_blank" style="background:#25d366;color:#fff;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;text-decoration:none;box-shadow:0 10px 25px rgba(37,211,102,0.4);transition:transform 0.2s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">💬</a>` : ''}
<a href="tel:${telClean}" style="background:#0a0a0a;color:#fff;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;text-decoration:none;box-shadow:0 10px 25px rgba(0,0,0,0.3);transition:transform 0.2s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">📞</a>
</div>`;
    out = out.replace('</body>', floatBtns + '</body>');
  }

  return out;
}

// Map sector_tpl (slug CRM) → archivo de plantilla
const templateAvailable = fs.readdirSync(TPL_DIR).map(f => f.replace('.html',''));
console.log('Plantillas disponibles:', templateAvailable.length);

const catalog = [];
let generated = 0, skipped = 0;
for (const lead of leads) {
  const tplFile = lead.sector_tpl + '.html';
  const tplPath = path.join(TPL_DIR, tplFile);
  if (!fs.existsSync(tplPath)) {
    // Fallback a abogado-gestoria (genérico)
    const fallback = path.join(TPL_DIR, 'abogado-gestoria.html');
    if (!fs.existsSync(fallback)) { skipped++; continue; }
    lead._tplUsed = 'abogado-gestoria (fallback)';
    var html = fs.readFileSync(fallback, 'utf8');
  } else {
    lead._tplUsed = lead.sector_tpl;
    var html = fs.readFileSync(tplPath, 'utf8');
  }
  const personalized = personalize(html, lead);
  const slug = slugify(lead.nombre) + '-' + (lead.place_id||'').slice(-6);
  const dir = path.join(OUT_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), personalized);
  catalog.push({
    slug, nombre: lead.nombre, sector: lead.sector, sector_tpl: lead._tplUsed,
    ciudad: lead.ciudad, telefono: lead.telefono, rating: lead.rating,
    reviews: lead.reviews, place_id: lead.place_id
  });
  generated++;
}

fs.writeFileSync(path.join(OUT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2));

// Index maestro
const indexHTML = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>50 Demos · G&G Elcano</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#fff;font-family:'Inter',sans-serif;padding:40px 20px;min-height:100vh}
.container{max-width:1400px;margin:0 auto}
h1{font-family:'Space Grotesk',sans-serif;font-size:52px;letter-spacing:-1.5px;margin-bottom:8px}
h1 i{color:#ff3d00;font-style:italic}
.sub{opacity:0.6;margin-bottom:30px;font-size:17px}
.stats{display:flex;gap:36px;margin:20px 0 36px;padding:24px;background:rgba(255,255,255,0.03);border-radius:16px;flex-wrap:wrap}
.stats strong{font-family:'Space Grotesk',sans-serif;font-size:28px;color:#ff3d00;display:block}
.stats span{font-size:11px;opacity:0.5;text-transform:uppercase;letter-spacing:1px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.card{padding:22px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;text-decoration:none;color:#fff;transition:all 0.25s;display:block}
.card:hover{transform:translateY(-3px);border-color:#ff3d00;background:rgba(255,61,0,0.08)}
.sector{display:inline-block;padding:3px 10px;background:rgba(255,61,0,0.15);color:#ff3d00;border-radius:10px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px}
.card h3{font-family:'Space Grotesk',sans-serif;font-size:18px;margin-bottom:4px;line-height:1.2}
.card .meta{opacity:0.55;font-size:13px}
</style></head><body>
<div class="container">
<h1>50 demos <i>nuevas</i> — plantillas oficiales</h1>
<p class="sub">Generadas desde Places API (Bizkaia), plantillas oficiales de G&G Elcano personalizadas con datos reales.</p>
<div class="stats">
  <div><strong>${catalog.length}</strong><span>Webs</span></div>
  <div><strong>${[...new Set(catalog.map(c=>c.sector))].length}</strong><span>Sectores</span></div>
  <div><strong>${[...new Set(catalog.map(c=>c.ciudad))].length}</strong><span>Ciudades</span></div>
  <div><strong>${catalog.filter(c=>c.rating>=4.5).length}</strong><span>Rating ≥ 4.5</span></div>
</div>
<div class="grid">
${catalog.map(c=>`<a class="card" href="./${c.slug}/"><div class="sector">${c.sector}</div><h3>${c.nombre}</h3><div class="meta">${c.ciudad} · ⭐${c.rating||'-'} (${c.reviews||0})</div></a>`).join('\n')}
</div>
</div></body></html>`;
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHTML);

console.log('\\n✅ Generadas:', generated, 'webs en demos-oficiales/');
console.log('Skipped:', skipped);
console.log('Plantillas usadas:');
const usage = {};
catalog.forEach(c => usage[c.sector_tpl] = (usage[c.sector_tpl]||0)+1);
Object.entries(usage).forEach(([k,v]) => console.log('  '+k+': '+v));
