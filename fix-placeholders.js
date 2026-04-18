// Arregla TODOS los placeholders residuales en las 50 demos
const fs = require('fs');
const path = require('path');

const leads = JSON.parse(fs.readFileSync('candidates-50-whatsapp.json','utf8')).leads;
const catalog = JSON.parse(fs.readFileSync('demos-oficiales/catalog.json','utf8'));
const byPlace = {}; leads.forEach(l => byPlace[l.place_id] = l);

// Genéricos por sector para llenar placeholders de hostelería / comida
const FOOD_DEFAULTS = {
  categoria: ['Entrantes', 'Platos principales', 'Postres'],
  plato: ['Tortilla de la casa', 'Croquetas caseras', 'Ensalada de temporada', 'Tabla de ibéricos', 'Bacalao al pil-pil', 'Chuletón de vaca vieja', 'Tarta de queso'],
  precio: ['12€', '15€', '18€', '22€'],
  precios: 'Precios consultar en local. Cubierto ~15-25€ por persona.',
  nota: 'Precios orientativos',
  evento: 'Comidas de empresa y celebraciones',
  espacio: 'Comedor principal para hasta 40 personas',
  descEspacio: 'Ambiente acogedor, ideal para reuniones familiares o de trabajo'
};

function pickN(arr, n) { const out = []; const copy = arr.slice(); while(out.length<n && copy.length) out.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0]); return out; }

function personalizeFinal(html, lead) {
  const name = lead.nombre || 'Tu Negocio';
  const city = lead.ciudad || 'España';
  const addr = lead.direccion || city;
  const tel = lead.telefono || '';
  const rating = lead.rating || 4.7;

  // 1. NOMBRE EN LOGO (el problema principal)
  // Patrón: [Nombre<span>.</span> o [Nombre</h... o [Nombre seguido de algo
  // Reemplaza solo la "[" al inicio por el nombre sin la apertura
  let out = html;
  // Logo exact: "[Nombre<span" → "{NAME}<span"
  out = out.replace(/\[Nombre(?=\s*<)/g, name);
  // "[Nombre seguido de ." o "]" literal al final
  out = out.replace(/\[Nombre del Negocio\]/g, name);
  out = out.replace(/\[Nombre\]/g, name);

  // 2. Datos contacto
  out = out.replace(/\[Tu Dirección Completa\]/g, addr);
  out = out.replace(/\[tu@email\.com\]/g, 'info@ggelcano.com');
  out = out.replace(/\[TELEFONO\]/g, tel);

  // 3. Títulos hero
  out = out.replace(/\[Título con <em>énfasis<\/em>\]/g, `El nombre que marca la <em>diferencia</em>`);

  // 4. Subtítulos
  out = out.replace(/\[Subtítulo — ej: Carta completa \/ Menú degustación\]/g, 'Nuestra carta');
  out = out.replace(/\[Subtítulo — ej: Nuestras cazuelitas \/ Nuestra carta \/ Pintxos\]/g, 'Nuestras especialidades');
  out = out.replace(/\[Subtítulo[^\]]*\]/g, 'Lo mejor de la casa');

  // 5. Categorías
  out = out.replace(/\[Categoría 1[^\]]*\]/g, FOOD_DEFAULTS.categoria[0]);
  out = out.replace(/\[Categoría 2[^\]]*\]/g, FOOD_DEFAULTS.categoria[1]);
  out = out.replace(/\[Categoría[^\]]*\]/g, (m,i) => {
    const cats = FOOD_DEFAULTS.categoria;
    return cats[Math.floor(Math.random()*cats.length)];
  });

  // 6. Platos
  const platos = pickN(FOOD_DEFAULTS.plato, 12);
  let pIdx = 0;
  out = out.replace(/\[Plato\s*\d*[^\]]*\]/g, () => platos[pIdx++ % platos.length]);

  // 7. Precios
  out = out.replace(/\[Precio\s*\d*[^\]]*\]/g, () => FOOD_DEFAULTS.precio[Math.floor(Math.random()*FOOD_DEFAULTS.precio.length)]);
  out = out.replace(/\[Precio desde X €\/persona[^\]]*\]/g, 'Consultar disponibilidad y presupuesto');

  // 8. Descripciones
  out = out.replace(/\[Descripción breve opcional\]/g, `${name} en ${city}. ${rating}⭐ en Google.`);
  out = out.replace(/\[Descripción breve\]/g, `Calidad y trato cercano desde hace años.`);
  out = out.replace(/\[Descripción con platos estrella reales\]/g, `Platos caseros con producto local. ${name} lleva años sirviendo en ${city}.`);
  out = out.replace(/\[Descripción del servicio principal[^\]]*\]/g, `Servicio profesional y personalizado. Cuidamos cada detalle para nuestros clientes en ${city}.`);
  out = out.replace(/\[Descripción y capacidad\]/g, FOOD_DEFAULTS.descEspacio);

  // 9. Info / notas
  out = out.replace(/\[Info de precios medios[^\]]*\]/g, FOOD_DEFAULTS.precios);
  out = out.replace(/\[Info de espacios privados[^\]]*\]/g, 'Espacios para grupos, menús cerrados y celebraciones. Consulta disponibilidad.');
  out = out.replace(/\[Nota destacada[^\]]*\]/g, FOOD_DEFAULTS.nota);

  // 10. Espacios / eventos
  out = out.replace(/\[Espacio\s*\d*[^\]]*\]/g, FOOD_DEFAULTS.espacio);
  out = out.replace(/\[Evento[^\]]*\]/g, FOOD_DEFAULTS.evento);

  // 11. Servicios
  const servicios = ['Carta del día', 'Menú degustación', 'Eventos privados'];
  let sIdx = 0;
  out = out.replace(/\[Servicio\s*\d*[^\]]*\]/g, () => servicios[sIdx++ % servicios.length]);

  // 12. Limpieza final: cualquier [xxxxxx] residual con texto que NO parezca HTML válido
  // Regla: si contiene "—" o palabras en mayúscula tras [, lo limpiamos
  out = out.replace(/\[([A-ZÁa-z][^\]<>\n]{5,80})\]/g, (match, inner) => {
    // Si parece un placeholder descriptivo (tiene — ó lowercase) lo quitamos
    if (inner.includes('—') || /^[a-záéíóú]/.test(inner)) return 'Información disponible';
    return match; // conservar si no parece placeholder
  });

  return out;
}

const dirs = fs.readdirSync('demos-oficiales').filter(d => fs.statSync('demos-oficiales/'+d).isDirectory());
let fixed = 0, noChange = 0;
const report = [];

for (const d of dirs) {
  const filePath = 'demos-oficiales/'+d+'/index.html';
  const orig = fs.readFileSync(filePath, 'utf8');
  // Encontrar lead por slug match
  const cat = catalog.find(c => c.slug === d);
  if (!cat) continue;
  const lead = byPlace[cat.place_id];
  if (!lead) continue;

  const newHtml = personalizeFinal(orig, lead);
  const before = (orig.match(/\[[A-ZÁa-z][^\]<>]{2,80}\]/g)||[]).length;
  const after = (newHtml.match(/\[[A-ZÁa-z][^\]<>]{2,80}\]/g)||[]).length;

  if (before !== after) {
    fs.writeFileSync(filePath, newHtml);
    fixed++;
    report.push({slug: d, before, after});
  } else {
    noChange++;
  }
}

console.log('✅ Arreglados:', fixed, '/', dirs.length);
console.log('Sin cambios:', noChange);
if (report.length) {
  console.log('\\nCambios por demo (top 10):');
  report.slice(0,10).forEach(r => console.log('  '+r.slug+': '+r.before+' → '+r.after+' placeholders'));
}
