// Regenera las 50 demos EN CARPETA NUEVA con fix ROBUSTO
const fs = require('fs');
const path = require('path');

const leads = JSON.parse(fs.readFileSync('candidates-50-whatsapp.json','utf8')).leads;
const TPL_DIR = 'tpls';
const OUT_DIR = 'demos-v2';

// Limpiar carpeta si existe
if (fs.existsSync(OUT_DIR)) {
  const rmRecursive = (d) => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) rmRecursive(p);
      else fs.unlinkSync(p);
    });
    fs.rmdirSync(d);
  };
  rmRecursive(OUT_DIR);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const slugify = s => (s||'').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0, 60);

// Genéricos por sector
const FOOD_CAT = ['Entrantes', 'Platos principales', 'Postres'];
const FOOD_PLATOS = ['Tortilla de la casa', 'Croquetas caseras', 'Ensalada de temporada', 'Tabla de ibéricos', 'Bacalao al pil-pil', 'Chuletón', 'Tarta de queso', 'Solomillo', 'Merluza'];
const PRECIOS = ['12€', '15€', '18€', '22€', '25€'];
const pickN = (arr, n) => { const c=arr.slice(), o=[]; while(o.length<n && c.length) o.push(c.splice(Math.floor(Math.random()*c.length),1)[0]); return o; };

function personalize(tplHtml, lead) {
  const name = lead.nombre || 'Tu Negocio';
  const city = lead.ciudad || 'España';
  const addr = lead.direccion || city;
  const tel = lead.telefono || '';
  const telClean = tel.replace(/\s/g,'');
  const isMobile = /^[67]/.test(telClean.replace(/^34/,''));
  const rating = lead.rating || 4.7;

  let out = tplHtml;

  // === PASO 1: Nombre en TODOS los contextos posibles ===
  // Cualquier "[Nombre" seguido de cualquier cosa hasta el siguiente espacio, tag o punto
  // CASE INSENSITIVE: Nombre, NOMBRE, nombre, etc.
  out = out.replace(/\[nombre\s+del\s+negocio\]/gi, name);
  out = out.replace(/\[nombre\]/gi, name);
  out = out.replace(/\[nombre\s*<span/gi, name+'<span');  // caza [Nombre<span, [NOMBRE <span, etc.
  out = out.replace(/\[nombre(?=[\s.<])/gi, name);
  out = out.replace(/\[nombre/gi, name);  // fallback absoluto case-insensitive

  // === PASO 2: Contacto ===
  out = out.replace(/\[Tu\s+Dirección\s+Completa\]/gi, addr);
  out = out.replace(/\[tu@email\.com\]/gi, 'info@ggelcano.com');
  out = out.replace(/\[TELEFONO\]/gi, tel);

  // === PASO 3: Hero titles ===
  out = out.replace(/\[Título\s+con\s*<em>énfasis<\/em>\]/gi, 'El nombre que marca la <em>diferencia</em>');

  // === PASO 4: Hostelería - CARTA ===
  let ci = 0;
  out = out.replace(/\[Categor[íi]a\s*\d*[^\]]*\]/gi, () => FOOD_CAT[ci++ % FOOD_CAT.length]);
  const platos = pickN(FOOD_PLATOS, 12);
  let pi = 0;
  out = out.replace(/\[Plato\s*\d*[^\]]*\]/gi, () => platos[pi++ % platos.length]);
  out = out.replace(/\[Precio\s*desde[^\]]*\]/gi, 'Consultar presupuesto');
  let pri = 0;
  out = out.replace(/\[Precio\s*\d*[^\]]*\]/gi, () => PRECIOS[pri++ % PRECIOS.length]);

  // === PASO 5: Subtítulos y descripciones ===
  out = out.replace(/\[Subt[íi]tulo[^\]]*Nuestras\s+cazuelitas[^\]]*\]/gi, 'Nuestras especialidades');
  out = out.replace(/\[Subt[íi]tulo[^\]]*Carta\s+completa[^\]]*\]/gi, 'Nuestra carta');
  out = out.replace(/\[Subt[íi]tulo[^\]]*\]/gi, 'Lo mejor de la casa');
  out = out.replace(/\[Descripci[óo]n\s+breve\s+opcional\]/gi, name+' en '+city+'. '+rating+'⭐ en Google.');
  out = out.replace(/\[Descripci[óo]n\s+breve\]/gi, 'Calidad y trato cercano desde hace años.');
  out = out.replace(/\[Descripci[óo]n\s+con\s+platos[^\]]*\]/gi, 'Platos caseros con producto local. '+name+' lleva años sirviendo en '+city+'.');
  out = out.replace(/\[Descripci[óo]n\s+del\s+servicio[^\]]*\]/gi, 'Servicio profesional y personalizado.');
  out = out.replace(/\[Descripci[óo]n\s+y\s+capacidad\]/gi, 'Ambiente acogedor para grupos pequeños y medianos.');

  // === PASO 6: Info / notas / espacios / eventos / servicios ===
  out = out.replace(/\[Info\s+de\s+precios[^\]]*\]/gi, 'Precios orientativos. Consulta en local.');
  out = out.replace(/\[Info\s+de\s+espacios[^\]]*\]/gi, 'Espacios para grupos y celebraciones. Consulta disponibilidad.');
  out = out.replace(/\[Nota\s+destacada[^\]]*\]/gi, 'Precios orientativos');
  out = out.replace(/\[Espacio\s*\d*[^\]]*\]/gi, 'Comedor principal');
  out = out.replace(/\[Evento[^\]]*\]/gi, 'Comidas de empresa y celebraciones');
  const servs = ['Carta del día', 'Menú degustación', 'Eventos privados'];
  let si = 0;
  out = out.replace(/\[Servicio\s*\d*[^\]]*\]/gi, () => servs[si++ % servs.length]);

  // === PASO 7: PLAN DE GUERRA - barrido final ===
  // Cualquier [xxx] que quede con descripción/guión lo convertimos en texto genérico
  out = out.replace(/\[([^\]\n<>]{5,100})\]/g, (match, inner) => {
    const low = inner.toLowerCase();
    if (low.includes('—') || low.includes(' - ej') || /^[a-záéíóú]/.test(inner) || low.includes('descrip') || low.includes('info')) {
      return 'Información disponible';
    }
    return match;
  });

  // === PASO 8: Nombres ficticios ===
  const fictitious = ['Salón Mía','Cafetería del Puerto','Restaurante La Mar','Clínica Dental Sonrisa','Óptica Sol','Estética Bella','Asador La Casa'];
  fictitious.forEach(f => { out = out.split(f).join(name); });

  // === PASO 9: Meta cache-control ===
  out = out.replace(/<head>/, `<head>
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
  <meta http-equiv="Pragma" content="no-cache"/>
  <meta http-equiv="Expires" content="0"/>`);

  // === PASO 10: Badge + botones flotantes ===
  const badge = `<div style="position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,0.92);color:#fff;padding:10px 18px;border-radius:24px;font-family:Inter,sans-serif;font-size:12px;z-index:99999;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,0.3)"><span style="width:8px;height:8px;background:#ff3d00;border-radius:50%"></span>Demo creada por <a href="https://github.com/ggeelcano" style="color:#ff6b3d;text-decoration:none;font-weight:600">G&G Elcano</a></div>`;
  let floatBtns = '';
  if (tel) {
    const waNum = isMobile ? ('34' + telClean.replace(/^34/,'')) : '';
    floatBtns = `<div style="position:fixed;bottom:20px;left:20px;display:flex;flex-direction:column;gap:10px;z-index:99999">
${waNum ? `<a href="https://wa.me/${waNum}?text=Hola%2C%20vengo%20de%20vuestra%20web%20demo" target="_blank" style="background:#25d366;color:#fff;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;text-decoration:none;box-shadow:0 10px 25px rgba(37,211,102,0.4)">💬</a>` : ''}
<a href="tel:${telClean}" style="background:#0a0a0a;color:#fff;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;text-decoration:none;box-shadow:0 10px 25px rgba(0,0,0,0.3)">📞</a>
</div>`;
  }
  out = out.replace('</body>', badge + floatBtns + '</body>');

  return out;
}

console.log('Regenerando 50 demos en', OUT_DIR, '/ ...\n');
const catalog = [];
let ok = 0;
for (const lead of leads) {
  const tplFile = (lead.sector_tpl || 'abogado-gestoria') + '.html';
  const tplPath = path.join(TPL_DIR, tplFile);
  const fallback = path.join(TPL_DIR, 'abogado-gestoria.html');
  const html = fs.readFileSync(fs.existsSync(tplPath) ? tplPath : fallback, 'utf8');

  const personalized = personalize(html, lead);

  // VERIFICACIÓN: 0 placeholders
  const remaining = personalized.match(/\[[A-ZÁa-z][^\]<>\n]{2,100}\]/g);
  if (remaining) console.log('⚠️ RESIDUAL en', lead.nombre, ':', remaining.slice(0,3).join(', '));

  const slug = slugify(lead.nombre) + '-' + (lead.place_id||'').slice(-6);
  const dir = path.join(OUT_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), personalized);
  catalog.push({
    slug, nombre: lead.nombre, sector: lead.sector,
    sector_tpl: fs.existsSync(tplPath) ? lead.sector_tpl : 'abogado-gestoria',
    ciudad: lead.ciudad, telefono: lead.telefono,
    rating: lead.rating, reviews: lead.reviews, place_id: lead.place_id
  });
  ok++;
}

fs.writeFileSync(path.join(OUT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2));

// Index
const indexHTML = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>50 Demos v2 · G&G Elcano</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#fff;font-family:'Inter',sans-serif;padding:40px 20px;min-height:100vh}
.container{max-width:1400px;margin:0 auto}
h1{font-family:'Space Grotesk',sans-serif;font-size:52px;letter-spacing:-1.5px;margin-bottom:8px}
h1 i{color:#ff3d00;font-style:italic}
.sub{opacity:0.6;margin-bottom:30px;font-size:17px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.card{padding:22px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;text-decoration:none;color:#fff;transition:all 0.25s;display:block}
.card:hover{transform:translateY(-3px);border-color:#ff3d00;background:rgba(255,61,0,0.08)}
.sector{display:inline-block;padding:3px 10px;background:rgba(255,61,0,0.15);color:#ff3d00;border-radius:10px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px}
.card h3{font-family:'Space Grotesk',sans-serif;font-size:18px;margin-bottom:4px;line-height:1.2}
.card .meta{opacity:0.55;font-size:13px}
</style></head><body>
<div class="container">
<h1>50 demos <i>v2</i></h1>
<p class="sub">Regeneradas desde cero con nombres corregidos (versión carpeta nueva sin caché).</p>
<div class="grid">
${catalog.map(c=>`<a class="card" href="./${c.slug}/"><div class="sector">${c.sector}</div><h3>${c.nombre}</h3><div class="meta">${c.ciudad} · ⭐${c.rating||'-'} (${c.reviews||0})</div></a>`).join('\n')}
</div></div></body></html>`;
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHTML);

console.log(`✅ ${ok} demos regeneradas en ${OUT_DIR}/`);
