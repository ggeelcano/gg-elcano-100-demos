// Generador para batch 100: plantillas antiguas + SIN badge + SIN botones flotantes + WCAG 2.2 AA
const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || 'candidates-100.json';
const OUT_DIR_NAME = process.argv[3] || 'demos-v3';
const leads = JSON.parse(fs.readFileSync(INPUT,'utf8')).leads;
const TPL_DIR = 'tpls';
const OUT_DIR = OUT_DIR_NAME;

// Clean output folder
if (fs.existsSync(OUT_DIR)) {
  const rm = d => { if (!fs.existsSync(d)) return; fs.readdirSync(d).forEach(f => { const p=path.join(d,f); if (fs.statSync(p).isDirectory()) rm(p); else fs.unlinkSync(p); }); fs.rmdirSync(d); };
  rm(OUT_DIR);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const slugify = s => (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0, 60);

const FOOD_CAT = ['Entrantes','Platos principales','Postres'];
const FOOD_PLATOS = ['Tortilla de la casa','Croquetas caseras','Ensalada de temporada','Tabla de ibéricos','Bacalao al pil-pil','Chuletón','Tarta de queso','Solomillo','Merluza'];
const PRECIOS = ['12€','15€','18€','22€','25€'];
const pickN = (arr,n)=>{const c=arr.slice(),o=[];while(o.length<n && c.length) o.push(c.splice(Math.floor(Math.random()*c.length),1)[0]); return o;};

// WCAG 2.2 AA boost - inyectado en el <head>
const WCAG_STYLES = `
<style>
  /* WCAG 2.2 AA — Accesibilidad */
  .skip-link { position:absolute; top:-40px; left:0; background:#000; color:#fff; padding:10px 18px; z-index:99999; text-decoration:none; border-radius:0 0 6px 0; font-weight:600; }
  .skip-link:focus { top:0; outline:3px solid #fff; }
  *:focus-visible { outline:3px solid currentColor !important; outline-offset:3px !important; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
</style>`;

function personalize(tplHtml, lead) {
  const name = lead.nombre || 'Tu Negocio';
  const city = lead.ciudad || 'España';
  const addr = lead.direccion || city;
  const tel = lead.telefono || '';
  const rating = lead.rating || 4.7;

  let out = tplHtml;

  // --- 1. Nombres (case insensitive + múltiples patrones) ---
  out = out.replace(/\[nombre\s+del\s+negocio\]/gi, name);
  out = out.replace(/\[nombre\]/gi, name);
  out = out.replace(/\[nombre\s*<span/gi, name+'<span');
  out = out.replace(/\[nombre(?=[\s.<])/gi, name);
  out = out.replace(/\[nombre/gi, name);

  // --- 2. Contacto ---
  out = out.replace(/\[Tu\s+Dirección\s+Completa\]/gi, addr);
  out = out.replace(/\[tu@email\.com\]/gi, 'info@ggelcano.com');
  out = out.replace(/\[TELEFONO\]/gi, tel);

  // --- 3. Hero titles ---
  out = out.replace(/\[Título\s+con\s*<em>énfasis<\/em>\]/gi, 'El nombre que marca la <em>diferencia</em>');

  // --- 4. Hostelería ---
  let ci = 0; out = out.replace(/\[Categor[íi]a\s*\d*[^\]]*\]/gi, ()=>FOOD_CAT[ci++%FOOD_CAT.length]);
  const platos = pickN(FOOD_PLATOS,12); let pi=0;
  out = out.replace(/\[Plato\s*\d*[^\]]*\]/gi, ()=>platos[pi++%platos.length]);
  out = out.replace(/\[Precio\s*desde[^\]]*\]/gi, 'Consultar presupuesto');
  let pri=0; out = out.replace(/\[Precio\s*\d*[^\]]*\]/gi, ()=>PRECIOS[pri++%PRECIOS.length]);

  // --- 5. Subtítulos/descripciones ---
  out = out.replace(/\[Subt[íi]tulo[^\]]*Nuestras\s+cazuelitas[^\]]*\]/gi, 'Nuestras especialidades');
  out = out.replace(/\[Subt[íi]tulo[^\]]*Carta\s+completa[^\]]*\]/gi, 'Nuestra carta');
  out = out.replace(/\[Subt[íi]tulo[^\]]*\]/gi, 'Lo mejor de la casa');
  out = out.replace(/\[Descripci[óo]n\s+breve\s+opcional\]/gi, name+' en '+city+'. '+rating+'⭐ en Google.');
  out = out.replace(/\[Descripci[óo]n\s+breve\]/gi, 'Calidad y trato cercano desde hace años.');
  out = out.replace(/\[Descripci[óo]n\s+con\s+platos[^\]]*\]/gi, 'Platos caseros con producto local. '+name+' lleva años en '+city+'.');
  out = out.replace(/\[Descripci[óo]n\s+del\s+servicio[^\]]*\]/gi, 'Servicio profesional y personalizado.');
  out = out.replace(/\[Descripci[óo]n\s+y\s+capacidad\]/gi, 'Ambiente acogedor para grupos.');

  // --- 6. Info/notas/espacios/eventos/servicios ---
  out = out.replace(/\[Info\s+de\s+precios[^\]]*\]/gi, 'Precios orientativos. Consulta en local.');
  out = out.replace(/\[Info\s+de\s+espacios[^\]]*\]/gi, 'Espacios para grupos y celebraciones.');
  out = out.replace(/\[Nota\s+destacada[^\]]*\]/gi, 'Precios orientativos');
  out = out.replace(/\[Espacio\s*\d*[^\]]*\]/gi, 'Comedor principal');
  out = out.replace(/\[Evento[^\]]*\]/gi, 'Comidas y celebraciones');
  const servs=['Carta del día','Menú degustación','Eventos privados']; let si=0;
  out = out.replace(/\[Servicio\s*\d*[^\]]*\]/gi, ()=>servs[si++%servs.length]);

  // --- 7. Barrido residual ---
  out = out.replace(/\[([^\]\n<>]{5,100})\]/g, (m,inner)=>{
    const low=inner.toLowerCase();
    if(low.includes('—')||low.includes(' - ej')||/^[a-záéíóú]/.test(inner)||low.includes('descrip')||low.includes('info')) return 'Información disponible';
    return m;
  });

  // --- 8. Nombres ficticios ---
  ['Salón Mía','Cafetería del Puerto','Restaurante La Mar','Clínica Dental Sonrisa','Óptica Sol','Estética Bella','Asador La Casa'].forEach(f=>{out=out.split(f).join(name);});

  // --- 9. WCAG 2.2 AA injection ---
  // Añadir lang si no está
  out = out.replace(/<html([^>]*)>/i, (m, attrs) => {
    if (/lang=/.test(attrs)) return m;
    return `<html lang="es"${attrs}>`;
  });

  // Meta descriptivo + cache-bust
  out = out.replace(/<head>/i, `<head>
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
  <meta http-equiv="Pragma" content="no-cache"/>
  <meta http-equiv="Expires" content="0"/>
  <meta name="description" content="${name} — ${lead.sector||''} en ${city}. ${rating}⭐ en Google."/>
  ${WCAG_STYLES}`);

  // Skip link al principio del body
  out = out.replace(/<body([^>]*)>/i, `<body$1>
<a class="skip-link" href="#main-content">Saltar al contenido principal</a>`);

  // aria-label al hamburger
  out = out.replace(/(<button[^>]*class="[^"]*hamburger[^"]*"[^>]*)(>)/gi, (m,attrs,close)=>{
    if (/aria-label=/.test(attrs)) return m;
    return attrs + ' aria-label="Abrir menú de navegación"' + close;
  });

  // <main id="main-content"> si no lo hay. Envolver el primer <section> como landmark si no.
  if (!/<main\b/i.test(out)) {
    out = out.replace(/<section/i, '<main id="main-content"><section');
    // Cerrar </main> antes de <footer>
    out = out.replace(/<footer/i, '</main><footer');
  } else {
    // Si hay main pero sin id
    out = out.replace(/<main(?![^>]*id=)/i, '<main id="main-content"');
  }

  // Alt text a imágenes sin alt
  out = out.replace(/<img((?:(?!>).)*?)>/g, (m, attrs) => {
    if (/\salt\s*=/.test(attrs)) return m;
    return `<img${attrs} alt="${name}">`;
  });

  // role="navigation" al nav si no lo hay
  out = out.replace(/<nav(?![^>]*role=)/gi, '<nav role="navigation" aria-label="Navegación principal"');

  return out;
}

console.log('Generando', leads.length, 'demos en', OUT_DIR, '/ ...\n');
const catalog = [];
let ok=0, residual=0;
for (const lead of leads) {
  const sectorTpl = lead.sector_tpl || 'abogado-gestoria';
  const tplPath = path.join(TPL_DIR, sectorTpl + '.html');
  const fallback = path.join(TPL_DIR, 'abogado-gestoria.html');
  const html = fs.readFileSync(fs.existsSync(tplPath) ? tplPath : fallback, 'utf8');

  const personalized = personalize(html, lead);

  // Verificación: NO debe quedar [nombre ni [Nombre ni [NOMBRE
  if (/\[nombre/i.test(personalized)) { residual++; console.log('⚠️', lead.nombre, '→ sigue [nombre'); }

  const slug = slugify(lead.nombre) + '-' + (lead.place_id||'').slice(-6);
  const dir = path.join(OUT_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), personalized);
  catalog.push({ slug, nombre: lead.nombre, sector: lead.sector, sector_tpl: fs.existsSync(tplPath)?sectorTpl:'abogado-gestoria', ciudad: lead.ciudad, telefono: lead.telefono, rating: lead.rating, reviews: lead.reviews, place_id: lead.place_id });
  ok++;
}

fs.writeFileSync(path.join(OUT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2));
console.log(`\n✅ ${ok} demos generadas en ${OUT_DIR}/`);
console.log('Con residuo [nombre:', residual);
