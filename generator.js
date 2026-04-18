// Generador masivo de 100 webs demo con animaciones Three.js por sector
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const INPUT = process.argv[2] || 'leads.json';
const leads = JSON.parse(fs.readFileSync(path.join(OUT_DIR, INPUT), 'utf8')).leads;

// Slugify
const slugify = s => (s||'').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// ======== ANIMACIONES POR SECTOR ========
// Cada función devuelve código JS que se ejecuta dentro del IIFE del hero canvas
const SECTOR_ANIMS = {
  'peluqueria': {
    label: 'Peluquería',
    emoji: '✂️',
    palette: { bg1: '#2d1b2e', bg2: '#1a0f1a', accent: '#d946ef', accent2: '#f0abfc' },
    headline: 'Tu <i>estilo</i>, tu web.',
    sub: 'Reservas online, galería de trabajos y reseñas de tus clientes. Sin que tengas que hacer nada.',
    threeScene: `
      // Tijeras 3D flotantes + partículas de pelo
      const scissors = [];
      for(let i=0;i<6;i++){
        const g = new THREE.Group();
        const blade1 = new THREE.Mesh(new THREE.ConeGeometry(0.15,1.5,4), new THREE.MeshStandardMaterial({color:0xd946ef,metalness:0.9,roughness:0.2}));
        blade1.position.y = 0.7;
        const blade2 = blade1.clone(); blade2.rotation.z = 0.3; blade2.position.x = 0.15;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25,0.05,8,20), new THREE.MeshStandardMaterial({color:0xf0abfc,metalness:0.8}));
        ring.position.set(-0.2,-0.5,0);
        g.add(blade1); g.add(blade2); g.add(ring);
        g.position.set((Math.random()-0.5)*25,(Math.random()-0.5)*15,(Math.random()-0.5)*10);
        g.userData = {rx: Math.random()*0.02-0.01, ry: Math.random()*0.02-0.01, baseY: g.position.y, phase: Math.random()*6};
        scene.add(g); scissors.push(g);
      }
      // Hair strands (curvas onduladas)
      const strands = [];
      for(let i=0;i<30;i++){
        const pts = [];
        for(let j=0;j<20;j++) pts.push(new THREE.Vector3(Math.sin(j*0.5)*0.3, j*0.15-1.5, Math.cos(j*0.5)*0.3));
        const curve = new THREE.CatmullRomCurve3(pts);
        const geo = new THREE.TubeGeometry(curve, 20, 0.02, 6, false);
        const mat = new THREE.MeshBasicMaterial({color: [0xd946ef,0xf0abfc,0xffffff][i%3], transparent:true, opacity:0.5});
        const m = new THREE.Mesh(geo, mat);
        m.position.set((Math.random()-0.5)*30,(Math.random()-0.5)*18,-Math.random()*15);
        m.userData = {phase: Math.random()*6};
        scene.add(m); strands.push(m);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.6));
      const pl = new THREE.PointLight(0xd946ef, 2, 30); pl.position.set(0,0,10); scene.add(pl);
      animHooks.push((t)=>{
        scissors.forEach(s=>{s.rotation.y+=s.userData.ry; s.rotation.z+=s.userData.rx; s.position.y = s.userData.baseY + Math.sin(t+s.userData.phase)*0.5;});
        strands.forEach(s=>{s.rotation.y = Math.sin(t+s.userData.phase)*0.3; s.position.x += 0.01; if(s.position.x>15) s.position.x=-15;});
      });
    `
  },
  'barberia': { inherits: 'peluqueria', label: 'Barbería', emoji: '💈', palette: { bg1: '#1a1a1a', bg2: '#0a0a0a', accent: '#dc2626', accent2: '#fbbf24' } },

  'hosteleria': {
    label: 'Hostelería', emoji: '🍽️',
    palette: { bg1: '#2d1b0e', bg2: '#1a0f08', accent: '#f59e0b', accent2: '#fbbf24' },
    headline: 'El <i>sabor</i> de tu casa, online.',
    sub: 'Reservas, carta digital, fotos que abren el apetito. Tu negocio trabaja hasta cuando descansas.',
    threeScene: `
      // Platos flotantes + velas + humo
      const plates = [];
      for(let i=0;i<8;i++){
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(1, 1, 0.08, 32),
          new THREE.MeshStandardMaterial({color: 0xfff5e6, metalness:0.2, roughness:0.5})
        );
        const food = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 16, 16),
          new THREE.MeshStandardMaterial({color: [0xf59e0b, 0xdc2626, 0x10b981, 0xf59e0b][i%4], roughness:0.7})
        );
        food.position.y = 0.15; food.scale.y = 0.5;
        const g = new THREE.Group(); g.add(plate); g.add(food);
        g.position.set((Math.random()-0.5)*25, (Math.random()-0.5)*14, -Math.random()*12);
        g.userData = {baseY: g.position.y, phase: Math.random()*6, rotSpeed: (Math.random()-0.5)*0.005};
        scene.add(g); plates.push(g);
      }
      // Sparks/humo
      const sparkCount = 80;
      const sparkPos = new Float32Array(sparkCount*3);
      for(let i=0;i<sparkCount;i++){sparkPos[i*3]=(Math.random()-0.5)*30;sparkPos[i*3+1]=-10+Math.random()*5;sparkPos[i*3+2]=(Math.random()-0.5)*15;}
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos,3));
      const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({color:0xfbbf24,size:0.15,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending}));
      scene.add(sparks);
      scene.add(new THREE.AmbientLight(0xffffff,0.5));
      const pl = new THREE.PointLight(0xf59e0b, 3, 30); pl.position.set(0,5,5); scene.add(pl);
      animHooks.push((t)=>{
        plates.forEach(p=>{p.position.y = p.userData.baseY + Math.sin(t+p.userData.phase)*0.6; p.rotation.y += p.userData.rotSpeed;});
        const spos = sparkGeo.attributes.position.array;
        for(let i=0;i<sparkCount;i++){spos[i*3+1]+=0.03; if(spos[i*3+1]>10) spos[i*3+1]=-10;}
        sparkGeo.attributes.position.needsUpdate = true;
      });
    `
  },
  'restaurante': { inherits: 'hosteleria', label: 'Restaurante', emoji: '🍴' },
  'bar-de-tapas': { inherits: 'hosteleria', label: 'Bar de Tapas', emoji: '🍷' },
  'cafeteria': { inherits: 'hosteleria', label: 'Cafetería', emoji: '☕', palette:{bg1:'#3d2817',bg2:'#1a0f08',accent:'#92400e',accent2:'#d97706'} },

  'pasteleria-panaderia': {
    label: 'Pastelería & Panadería', emoji: '🥐',
    palette: { bg1: '#fef3c7', bg2: '#fde68a', accent: '#d97706', accent2: '#78350f', textOnBg: '#451a03' },
    invertTheme: true,
    headline: 'Tu <i>horno</i>, a la vista del mundo.',
    sub: 'Encargos online de tartas, catálogo de panes, fotos que saben a mantequilla. Vender más sin abrir antes.',
    threeScene: `
      // Panes/croissants flotantes + harina cayendo
      const breads = [];
      const loaderGeo = (i) => {
        if(i%3===0){const g = new THREE.TorusGeometry(0.6,0.3,8,20); return g;}
        if(i%3===1){const g = new THREE.CapsuleGeometry(0.35,0.8,4,8); return g;}
        return new THREE.SphereGeometry(0.6, 16, 16);
      };
      for(let i=0;i<10;i++){
        const m = new THREE.Mesh(
          loaderGeo(i),
          new THREE.MeshStandardMaterial({color: [0xd97706, 0xfbbf24, 0x92400e][i%3], roughness:0.8})
        );
        m.position.set((Math.random()-0.5)*25, (Math.random()-0.5)*14, -Math.random()*12);
        m.userData = {baseY: m.position.y, phase: Math.random()*6, rx: Math.random()*0.01, ry: Math.random()*0.015};
        scene.add(m); breads.push(m);
      }
      // Harina (partículas blancas cayendo)
      const flourCount = 150;
      const flourPos = new Float32Array(flourCount*3);
      for(let i=0;i<flourCount;i++){flourPos[i*3]=(Math.random()-0.5)*35;flourPos[i*3+1]=Math.random()*20-10;flourPos[i*3+2]=(Math.random()-0.5)*15;}
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(flourPos,3));
      const flour = new THREE.Points(fg, new THREE.PointsMaterial({color:0xfffbeb,size:0.08,transparent:true,opacity:0.7}));
      scene.add(flour);
      scene.add(new THREE.AmbientLight(0xfffbeb,0.7));
      const pl = new THREE.DirectionalLight(0xfef3c7, 1.2); pl.position.set(5,10,5); scene.add(pl);
      animHooks.push((t)=>{
        breads.forEach(b=>{b.position.y = b.userData.baseY + Math.sin(t+b.userData.phase)*0.5; b.rotation.x += b.userData.rx; b.rotation.y += b.userData.ry;});
        const fp = fg.attributes.position.array;
        for(let i=0;i<flourCount;i++){fp[i*3+1]-=0.02; if(fp[i*3+1]<-12) fp[i*3+1]=12;}
        fg.attributes.position.needsUpdate = true;
      });
    `
  },

  'taller-mecanico': {
    label: 'Taller Mecánico', emoji: '🔧',
    palette: { bg1: '#0a1929', bg2: '#000814', accent: '#ff6b00', accent2: '#ffbe0b' },
    headline: 'Tu <i>taller</i>, sin límite de horario.',
    sub: 'Citas online, presupuestos rápidos, historial de clientes. Mientras reparas, tu web capta.',
    threeScene: `
      // Engranajes 3D + chispas
      const gears = [];
      function makeGear(teeth, r, color){
        const shape = new THREE.Shape();
        const inner = r*0.7;
        const outer = r;
        for(let i=0;i<teeth*2;i++){
          const angle = (i/(teeth*2))*Math.PI*2;
          const rad = i%2===0 ? outer : inner;
          const x = Math.cos(angle)*rad, y = Math.sin(angle)*rad;
          if(i===0) shape.moveTo(x,y); else shape.lineTo(x,y);
        }
        const hole = new THREE.Path();
        hole.absarc(0,0,r*0.2,0,Math.PI*2,true);
        shape.holes.push(hole);
        const geo = new THREE.ExtrudeGeometry(shape, {depth:0.15, bevelEnabled:true, bevelSize:0.03, bevelThickness:0.03});
        return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color, metalness:0.9, roughness:0.3}));
      }
      for(let i=0;i<7;i++){
        const gear = makeGear(8+Math.floor(Math.random()*6), 0.8+Math.random()*0.8, [0xff6b00, 0x64748b, 0xffbe0b, 0xff6b00][i%4]);
        gear.position.set((Math.random()-0.5)*25, (Math.random()-0.5)*14, -Math.random()*12);
        gear.userData = {speed: (Math.random()-0.5)*0.02 + 0.005, baseY: gear.position.y, phase: Math.random()*6};
        scene.add(gear); gears.push(gear);
      }
      // Chispas
      const sparkCount = 100;
      const sparkPos = new Float32Array(sparkCount*3);
      const sparkVel = [];
      for(let i=0;i<sparkCount;i++){
        sparkPos[i*3]=(Math.random()-0.5)*30;sparkPos[i*3+1]=(Math.random()-0.5)*18;sparkPos[i*3+2]=(Math.random()-0.5)*10;
        sparkVel.push({x:(Math.random()-0.5)*0.3,y:(Math.random())*0.2+0.05,z:(Math.random()-0.5)*0.1});
      }
      const sparkGeo = new THREE.BufferGeometry(); sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos,3));
      const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({color:0xff6b00,size:0.12,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending}));
      scene.add(sparks);
      scene.add(new THREE.AmbientLight(0x6688aa,0.4));
      const pl = new THREE.PointLight(0xff6b00, 3, 40); pl.position.set(0,0,10); scene.add(pl);
      animHooks.push((t)=>{
        gears.forEach(g=>{g.rotation.z += g.userData.speed; g.position.y = g.userData.baseY + Math.sin(t*0.5+g.userData.phase)*0.2;});
        const sp = sparkGeo.attributes.position.array;
        for(let i=0;i<sparkCount;i++){sp[i*3]+=sparkVel[i].x;sp[i*3+1]+=sparkVel[i].y;sp[i*3+2]+=sparkVel[i].z; if(sp[i*3+1]>12){sp[i*3]=(Math.random()-0.5)*30;sp[i*3+1]=-12;sp[i*3+2]=(Math.random()-0.5)*10;}}
        sparkGeo.attributes.position.needsUpdate = true;
      });
    `
  },
  'taller': { inherits: 'taller-mecanico', label: 'Taller', emoji: '🔨' },

  'veterinaria': {
    label: 'Veterinaria', emoji: '🐾',
    palette: { bg1: '#023047', bg2: '#011627', accent: '#00a896', accent2: '#52ffc3' },
    headline: 'El <i>cuidado</i> que merece tu familia peluda.',
    sub: 'Citas online, historial de vacunas, recordatorios automáticos. Profesionalidad que transmite confianza.',
    threeScene: `
      // Huellas flotantes + ondas de corazón + patas
      const paws = [];
      function makePaw(){
        const g = new THREE.Group();
        const pad = new THREE.Mesh(new THREE.SphereGeometry(0.35,12,12), new THREE.MeshStandardMaterial({color:0x52ffc3,metalness:0.3,roughness:0.4}));
        pad.scale.set(1,0.6,1); g.add(pad);
        for(let i=0;i<4;i++){
          const toe = new THREE.Mesh(new THREE.SphereGeometry(0.15,10,10), new THREE.MeshStandardMaterial({color:0x00a896,roughness:0.5}));
          toe.scale.set(1,0.5,1);
          const angle = (i/3-0.5)*1.2;
          toe.position.set(Math.sin(angle)*0.5, 0.2, -Math.cos(angle)*0.5);
          g.add(toe);
        }
        return g;
      }
      for(let i=0;i<10;i++){
        const paw = makePaw();
        paw.position.set((Math.random()-0.5)*28, (Math.random()-0.5)*16, -Math.random()*12);
        paw.rotation.y = Math.random()*Math.PI*2;
        paw.userData = {baseY: paw.position.y, phase: Math.random()*6, rotY: (Math.random()-0.5)*0.01};
        scene.add(paw); paws.push(paw);
      }
      // Heart pulses
      const hearts = [];
      for(let i=0;i<5;i++){
        const shape = new THREE.Shape();
        shape.moveTo(0,-0.3);
        shape.bezierCurveTo(0.5,-0.3, 0.6,0.5, 0,0.4);
        shape.bezierCurveTo(-0.6,0.5, -0.5,-0.3, 0,-0.3);
        const geo = new THREE.ShapeGeometry(shape);
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:0xff6b9d, transparent:true, opacity:0.4}));
        m.position.set((Math.random()-0.5)*20,(Math.random()-0.5)*12,-Math.random()*8);
        m.userData = {phase: Math.random()*6, baseScale: 0.5+Math.random()*0.5};
        scene.add(m); hearts.push(m);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.6));
      const pl = new THREE.PointLight(0x52ffc3, 2, 30); pl.position.set(0,0,10); scene.add(pl);
      animHooks.push((t)=>{
        paws.forEach(p=>{p.position.y = p.userData.baseY + Math.sin(t+p.userData.phase)*0.5; p.rotation.y += p.userData.rotY;});
        hearts.forEach(h=>{const s = h.userData.baseScale*(1+Math.sin(t*2+h.userData.phase)*0.2); h.scale.set(s,s,s); h.material.opacity = 0.3+Math.abs(Math.sin(t*2+h.userData.phase))*0.4;});
      });
    `
  },

  'salud': {
    label: 'Salud', emoji: '🏥',
    palette: { bg1: '#eaf4f4', bg2: '#c0e0e0', accent: '#00a896', accent2: '#023047', textOnBg: '#023047' },
    invertTheme: true,
    headline: 'Tu <i>salud</i> merece la mejor presentación.',
    sub: 'Citas online, equipo visible, especialidades claras. Los pacientes eligen a quien transmite confianza.',
    threeScene: `
      // Cruz médica pulsante + ondas
      const crosses = [];
      for(let i=0;i<6;i++){
        const g = new THREE.Group();
        const v = new THREE.Mesh(new THREE.BoxGeometry(0.3,1.2,0.3), new THREE.MeshStandardMaterial({color:0x00a896,metalness:0.3}));
        const h = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.3,0.3), new THREE.MeshStandardMaterial({color:0x00a896,metalness:0.3}));
        g.add(v); g.add(h);
        g.position.set((Math.random()-0.5)*25, (Math.random()-0.5)*14, -Math.random()*12);
        g.userData = {baseY:g.position.y, phase: Math.random()*6, rotZ: (Math.random()-0.5)*0.01};
        scene.add(g); crosses.push(g);
      }
      // Ondas concéntricas (heartbeat)
      const waves = [];
      for(let i=0;i<3;i++){
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.5,0.6,32), new THREE.MeshBasicMaterial({color:0x00a896, transparent:true, opacity:0.6, side:THREE.DoubleSide}));
        ring.position.set(0,0,-5);
        ring.userData = {phase: i*2};
        scene.add(ring); waves.push(ring);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.7));
      const pl = new THREE.DirectionalLight(0x00a896, 1.2); pl.position.set(5,10,5); scene.add(pl);
      animHooks.push((t)=>{
        crosses.forEach(c=>{c.position.y = c.userData.baseY + Math.sin(t+c.userData.phase)*0.4; c.rotation.z += c.userData.rotZ;});
        waves.forEach(w=>{const s = ((t+w.userData.phase)%3)*3; w.scale.set(s,s,1); w.material.opacity = Math.max(0, 0.6 - s/10);});
      });
    `
  },

  'tienda-ropa': {
    label: 'Tienda de Ropa', emoji: '👔',
    palette: { bg1: '#1e1b4b', bg2: '#0f0c29', accent: '#ec4899', accent2: '#f472b6' },
    headline: 'Tu <i>estilo</i>, en cada pantalla.',
    sub: 'Catálogo que se actualiza solo, fotos que venden, compra directa. Tu tienda abierta 24/7.',
    threeScene: `
      // Perchas 3D + tejidos ondulando
      const hangers = [];
      for(let i=0;i<8;i++){
        const g = new THREE.Group();
        // Hanger hook
        const hookCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,1,0),new THREE.Vector3(0.2,1.2,0),new THREE.Vector3(0,1.4,0),new THREE.Vector3(-0.2,1.2,0)]);
        const hook = new THREE.Mesh(new THREE.TubeGeometry(hookCurve,16,0.04,8,false), new THREE.MeshStandardMaterial({color:0xec4899,metalness:0.9}));
        g.add(hook);
        // Triangle bar
        const barGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.8,0,0),new THREE.Vector3(0.8,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(-0.8,0,0)]);
        const bar = new THREE.Line(barGeo, new THREE.LineBasicMaterial({color:0xf472b6,linewidth:2}));
        g.add(bar);
        // Fabric plane
        const fabGeo = new THREE.PlaneGeometry(1.6, 1.5, 20, 15);
        const fab = new THREE.Mesh(fabGeo, new THREE.MeshStandardMaterial({color:[0xec4899,0xf472b6,0x8b5cf6,0xffffff][i%4], side:THREE.DoubleSide, transparent:true, opacity:0.85}));
        fab.position.y = -0.8; g.add(fab);
        g.position.set((Math.random()-0.5)*25, (Math.random()-0.5)*14, -Math.random()*12);
        g.userData = {baseY:g.position.y, phase: Math.random()*6, fabric: fab};
        scene.add(g); hangers.push(g);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.5));
      const pl = new THREE.PointLight(0xec4899, 2, 30); pl.position.set(0,0,10); scene.add(pl);
      animHooks.push((t)=>{
        hangers.forEach(h=>{
          h.position.y = h.userData.baseY + Math.sin(t+h.userData.phase)*0.4;
          h.rotation.z = Math.sin(t*0.5+h.userData.phase)*0.1;
          // Wave fabric
          const pos = h.userData.fabric.geometry.attributes.position;
          for(let i=0;i<pos.count;i++){
            const x=pos.getX(i), y=pos.getY(i);
            pos.setZ(i, Math.sin(x*2 + t*2 + h.userData.phase)*0.05 + Math.cos(y*2 + t*1.5)*0.03);
          }
          pos.needsUpdate = true;
        });
      });
    `
  },
  'comercio': { inherits: 'tienda-ropa', label: 'Comercio', emoji: '🛍️' },

  'educacion': {
    label: 'Educación', emoji: '📚',
    palette: { bg1: '#1e293b', bg2: '#0f172a', accent: '#3b82f6', accent2: '#60a5fa' },
    headline: 'Tu <i>academia</i>, con presencia digital.',
    sub: 'Matrículas online, horarios claros, testimonios de alumnos. La web que convence a los padres.',
    threeScene: `
      // Libros 3D + letras/números flotantes
      const books = [];
      for(let i=0;i<10;i++){
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.7+Math.random()*0.3, 1+Math.random()*0.4, 0.15),
          new THREE.MeshStandardMaterial({color:[0x3b82f6,0x60a5fa,0xef4444,0xfbbf24,0x10b981][i%5],roughness:0.6})
        );
        book.position.set((Math.random()-0.5)*25,(Math.random()-0.5)*14,-Math.random()*12);
        book.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        book.userData = {baseY:book.position.y,phase:Math.random()*6,rx:(Math.random()-0.5)*0.01,ry:(Math.random()-0.5)*0.01};
        scene.add(book); books.push(book);
      }
      // Partículas (letras)
      const letterCount = 60;
      const lp = new Float32Array(letterCount*3);
      for(let i=0;i<letterCount;i++){lp[i*3]=(Math.random()-0.5)*30;lp[i*3+1]=(Math.random()-0.5)*18;lp[i*3+2]=(Math.random()-0.5)*10;}
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp,3));
      const ls = new THREE.Points(lg, new THREE.PointsMaterial({color:0x60a5fa,size:0.2,transparent:true,opacity:0.7}));
      scene.add(ls);
      scene.add(new THREE.AmbientLight(0xffffff,0.5));
      const pl = new THREE.PointLight(0x3b82f6, 2, 30); pl.position.set(0,0,10); scene.add(pl);
      animHooks.push((t)=>{
        books.forEach(b=>{b.position.y=b.userData.baseY+Math.sin(t+b.userData.phase)*0.4; b.rotation.x+=b.userData.rx; b.rotation.y+=b.userData.ry;});
        const p = lg.attributes.position.array;
        for(let i=0;i<letterCount;i++){p[i*3+1]+=0.02; if(p[i*3+1]>12) p[i*3+1]=-12;}
        lg.attributes.position.needsUpdate = true;
      });
    `
  },

  'clinica-dental': { inherits: 'salud', label: 'Clínica Dental', emoji: '🦷' },
  'fisioterapia': { inherits: 'salud', label: 'Fisioterapia', emoji: '💆' },
  'food-truck': { inherits: 'hosteleria', label: 'Food Truck', emoji: '🚚' },
  'cerveceria': { inherits: 'hosteleria', label: 'Cervecería', emoji: '🍺', palette:{bg1:'#1a0f05',bg2:'#0a0502',accent:'#d97706',accent2:'#fbbf24'} },
  'crossfit': { inherits: 'gimnasio', label: 'CrossFit', emoji: '🏋️' },

  'gimnasio': {
    label: 'Gimnasio', emoji: '💪',
    palette: { bg1: '#0a0a0a', bg2: '#1a0000', accent: '#ef4444', accent2: '#fbbf24' },
    headline: 'La <i>energía</i> de tu gimnasio, online.',
    sub: 'Horarios de clases, entrenadores, suscripciones. Los que buscan ponerse en forma llegan primero a tu web.',
    threeScene: `
      // Pesas 3D flotantes + ondas de energía
      const weights = [];
      for(let i=0;i<6;i++){
        const g = new THREE.Group();
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 12), new THREE.MeshStandardMaterial({color:0x333333, metalness:0.9, roughness:0.2}));
        bar.rotation.z = Math.PI/2; g.add(bar);
        for(let side=-1; side<=1; side+=2){
          const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 20), new THREE.MeshStandardMaterial({color:0xef4444, metalness:0.6, roughness:0.4}));
          plate.rotation.z = Math.PI/2; plate.position.x = side*1.1; g.add(plate);
        }
        g.position.set((Math.random()-0.5)*25,(Math.random()-0.5)*14,-Math.random()*12);
        g.userData = {baseY:g.position.y,phase:Math.random()*6,rz:(Math.random()-0.5)*0.02,ry:(Math.random()-0.5)*0.01};
        scene.add(g); weights.push(g);
      }
      // Líneas de energía
      const energyLines = [];
      for(let i=0;i<40;i++){
        const pts = [new THREE.Vector3(-3+Math.random()*6, Math.random()*8-4, -Math.random()*8),new THREE.Vector3(-3+Math.random()*6, Math.random()*8-4, -Math.random()*8)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({color:0xef4444, transparent:true, opacity:0.3}));
        line.userData = {phase:Math.random()*6};
        scene.add(line); energyLines.push(line);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.4));
      const pl = new THREE.PointLight(0xef4444, 3, 30); pl.position.set(0,0,10); scene.add(pl);
      animHooks.push((t)=>{
        weights.forEach(w=>{w.position.y=w.userData.baseY+Math.sin(t+w.userData.phase)*0.4; w.rotation.z+=w.userData.rz; w.rotation.y+=w.userData.ry;});
        energyLines.forEach(l=>{l.material.opacity = 0.2+Math.abs(Math.sin(t*3+l.userData.phase))*0.6;});
      });
    `
  },

  'optica': {
    label: 'Óptica', emoji: '👓',
    palette: { bg1: '#eff6ff', bg2: '#dbeafe', accent: '#2563eb', accent2: '#7c3aed', textOnBg: '#0a1929' },
    invertTheme: true,
    headline: 'Tu <i>mirada</i>, con estilo profesional.',
    sub: 'Catálogo de monturas, graduaciones online, citas directas. El cliente elige antes de entrar.',
    threeScene: `
      // Gafas 3D flotantes
      const glassesList = [];
      for(let i=0;i<8;i++){
        const g = new THREE.Group();
        // Lentes
        for(let side=-1; side<=1; side+=2){
          const lens = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 24), new THREE.MeshStandardMaterial({color:[0x2563eb,0x7c3aed,0x0a1929,0xff6b00][i%4], metalness:0.8, roughness:0.2}));
          lens.position.x = side*0.6;
          g.add(lens);
          // Cristal transparente
          const glass = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshPhysicalMaterial({color:0xffffff, transparent:true, opacity:0.15, roughness:0, transmission:0.9, ior:1.5}));
          glass.position.x = side*0.6; g.add(glass);
        }
        // Puente
        const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.25,8), new THREE.MeshStandardMaterial({color:0x2563eb,metalness:0.8}));
        bridge.rotation.z = Math.PI/2; g.add(bridge);
        // Patillas
        for(let side=-1; side<=1; side+=2){
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), new THREE.MeshStandardMaterial({color:0x2563eb,metalness:0.8}));
          arm.position.set(side*1.3, 0, 0);
          g.add(arm);
        }
        g.position.set((Math.random()-0.5)*25,(Math.random()-0.5)*14,-Math.random()*12);
        g.userData = {baseY:g.position.y,phase:Math.random()*6,ry:(Math.random()-0.5)*0.01};
        scene.add(g); glassesList.push(g);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.8));
      const pl = new THREE.DirectionalLight(0x2563eb, 1.5); pl.position.set(5,10,5); scene.add(pl);
      animHooks.push((t)=>{
        glassesList.forEach(g=>{g.position.y=g.userData.baseY+Math.sin(t+g.userData.phase)*0.4; g.rotation.y+=g.userData.ry; g.rotation.z=Math.sin(t*0.5+g.userData.phase)*0.15;});
      });
    `
  },

  'inmobiliaria': {
    label: 'Inmobiliaria', emoji: '🏠',
    palette: { bg1: '#1e293b', bg2: '#0f172a', accent: '#f59e0b', accent2: '#fbbf24' },
    headline: 'El <i>catálogo</i> que convierte visitas en firmas.',
    sub: 'Tus propiedades online, filtros potentes, solicitud de visita en un click. Tu web vende mientras duermes.',
    threeScene: `
      // Casas/edificios 3D isométricos
      const buildings = [];
      for(let i=0;i<10;i++){
        const g = new THREE.Group();
        const h = 1 + Math.random()*2;
        const base = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), new THREE.MeshStandardMaterial({color:[0xf59e0b,0xfbbf24,0xffffff,0x64748b][i%4],metalness:0.2,roughness:0.7}));
        g.add(base);
        // Tejado
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.6, 4), new THREE.MeshStandardMaterial({color:0xdc2626,metalness:0.3}));
        roof.position.y = h/2+0.3; roof.rotation.y = Math.PI/4; g.add(roof);
        // Ventanas (pequeños cuadrados)
        for(let wy=0; wy<Math.floor(h); wy++){
          for(let wx=-1; wx<=1; wx+=2){
            const win = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.15), new THREE.MeshBasicMaterial({color:0xfbbf24}));
            win.position.set(wx*0.3, -h/2+0.3+wy*0.5, 0.51);
            g.add(win);
          }
        }
        g.position.set((Math.random()-0.5)*25, -4+Math.random()*8, -Math.random()*12);
        g.userData = {baseY:g.position.y, phase:Math.random()*6, ry:(Math.random()-0.5)*0.005};
        scene.add(g); buildings.push(g);
      }
      // Grid suelo
      const grid = new THREE.GridHelper(40,30,0xf59e0b,0x333);
      grid.material.transparent=true; grid.material.opacity=0.25; grid.position.y=-7; scene.add(grid);
      scene.add(new THREE.AmbientLight(0xffffff,0.6));
      const pl = new THREE.DirectionalLight(0xfbbf24, 1.4); pl.position.set(5,10,5); scene.add(pl);
      animHooks.push((t)=>{
        buildings.forEach(b=>{b.position.y = b.userData.baseY + Math.sin(t*0.8 + b.userData.phase)*0.15; b.rotation.y += b.userData.ry;});
      });
    `
  },

  'floristeria': {
    label: 'Floristería', emoji: '🌸',
    palette: { bg1: '#fdf2f8', bg2: '#fce7f3', accent: '#db2777', accent2: '#ec4899', textOnBg: '#500724' },
    invertTheme: true,
    headline: 'Tus <i>flores</i>, a un click.',
    sub: 'Encargos online, ramos para cada ocasión, entregas a domicilio. La web que florece tu negocio.',
    threeScene: `
      // Pétalos cayendo + flores 3D
      const flowers = [];
      for(let i=0;i<6;i++){
        const g = new THREE.Group();
        for(let p=0;p<8;p++){
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({color:[0xec4899,0xdb2777,0xf0abfc,0xff6b9d,0xffffff][i%5],roughness:0.6}));
          petal.scale.set(1,0.35,0.7);
          const ang = (p/8)*Math.PI*2;
          petal.position.set(Math.cos(ang)*0.5, 0, Math.sin(ang)*0.5);
          petal.rotation.y = ang;
          g.add(petal);
        }
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.25,12,12), new THREE.MeshStandardMaterial({color:0xfbbf24}));
        g.add(center);
        g.position.set((Math.random()-0.5)*25,(Math.random()-0.5)*14,-Math.random()*12);
        g.userData = {baseY:g.position.y,phase:Math.random()*6,ry:(Math.random()-0.5)*0.01};
        scene.add(g); flowers.push(g);
      }
      // Pétalos flotantes
      const petalCount = 80;
      const pp = new Float32Array(petalCount*3);
      const pv = [];
      for(let i=0;i<petalCount;i++){
        pp[i*3]=(Math.random()-0.5)*30; pp[i*3+1]=Math.random()*20-5; pp[i*3+2]=(Math.random()-0.5)*15;
        pv.push({y:-0.02-Math.random()*0.03, x:(Math.random()-0.5)*0.02, phase: Math.random()*6});
      }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp,3));
      const petals = new THREE.Points(pg, new THREE.PointsMaterial({color:0xec4899,size:0.18,transparent:true,opacity:0.8}));
      scene.add(petals);
      scene.add(new THREE.AmbientLight(0xffffff,0.7));
      const pl = new THREE.DirectionalLight(0xdb2777, 1.2); pl.position.set(5,10,5); scene.add(pl);
      animHooks.push((t)=>{
        flowers.forEach(f=>{f.position.y=f.userData.baseY+Math.sin(t+f.userData.phase)*0.4; f.rotation.y+=f.userData.ry;});
        const p = pg.attributes.position.array;
        for(let i=0;i<petalCount;i++){
          p[i*3+1] += pv[i].y; p[i*3] += Math.sin(t+pv[i].phase)*0.01;
          if(p[i*3+1] < -12) p[i*3+1] = 15;
        }
        pg.attributes.position.needsUpdate = true;
      });
    `
  },

  'fontaneria': {
    label: 'Fontanería', emoji: '🔧',
    palette: { bg1: '#0c4a6e', bg2: '#082f49', accent: '#06b6d4', accent2: '#67e8f9' },
    headline: 'Tu <i>teléfono</i> sonando sin parar.',
    sub: 'Urgencias 24h, presupuestos rápidos, testimonios que generan confianza. La web que te trae clientes dormido.',
    threeScene: `
      // Gotas de agua + tuberías
      const drops = [];
      for(let i=0;i<60;i++){
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.12+Math.random()*0.08, 8, 8), new THREE.MeshPhysicalMaterial({color:0x06b6d4, transparent:true, opacity:0.8, metalness:0.3, roughness:0.1, transmission:0.5}));
        drop.scale.y = 1.5;
        drop.position.set((Math.random()-0.5)*30, Math.random()*20-5, (Math.random()-0.5)*12);
        drop.userData = {vy: -0.05-Math.random()*0.05, startY: drop.position.y};
        scene.add(drop); drops.push(drop);
      }
      // Tuberías 3D
      const pipes = [];
      for(let i=0;i<5;i++){
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*10, -5-Math.random()*5),
          new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*10, -5-Math.random()*5),
          new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*10, -5-Math.random()*5)
        ]);
        const geo = new THREE.TubeGeometry(path, 30, 0.2, 8, false);
        const pipe = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:0x64748b, metalness:0.9, roughness:0.3}));
        scene.add(pipe); pipes.push(pipe);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.5));
      const pl = new THREE.PointLight(0x06b6d4, 2.5, 30); pl.position.set(0,5,10); scene.add(pl);
      animHooks.push((t)=>{
        drops.forEach(d=>{
          d.position.y += d.userData.vy;
          if(d.position.y < -12) d.position.y = 12;
        });
      });
    `
  },

  'ferreteria': {
    label: 'Ferretería', emoji: '🔨',
    palette: { bg1: '#1a1a1a', bg2: '#0a0a0a', accent: '#f97316', accent2: '#fbbf24' },
    headline: 'Tu <i>catálogo</i> completo en casa del cliente.',
    sub: 'Miles de productos, búsqueda por nombre, disponibilidad al momento. Tu tienda no cierra nunca.',
    threeScene: `
      // Herramientas 3D flotantes
      const tools = [];
      function makeHammer(){
        const g = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,1.5,8), new THREE.MeshStandardMaterial({color:0x78350f,roughness:0.8}));
        g.add(handle);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.3,0.25), new THREE.MeshStandardMaterial({color:0xf97316,metalness:0.9,roughness:0.2}));
        head.position.y = 0.85; g.add(head);
        return g;
      }
      function makeWrench(){
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.2,1.5,0.15), new THREE.MeshStandardMaterial({color:0x64748b,metalness:0.9}));
        g.add(body);
        const h1 = new THREE.Mesh(new THREE.TorusGeometry(0.3,0.1,8,16,Math.PI*1.5), new THREE.MeshStandardMaterial({color:0x64748b,metalness:0.9}));
        h1.position.y = 0.8; h1.rotation.z = Math.PI/2; g.add(h1);
        return g;
      }
      function makeScrew(){
        const g = new THREE.Group();
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,0.15,16), new THREE.MeshStandardMaterial({color:0xfbbf24,metalness:0.9}));
        g.add(head);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,1,12), new THREE.MeshStandardMaterial({color:0xf97316,metalness:0.8}));
        shaft.position.y = -0.6; g.add(shaft);
        return g;
      }
      const makers = [makeHammer, makeWrench, makeScrew];
      for(let i=0;i<10;i++){
        const tool = makers[i%3]();
        tool.position.set((Math.random()-0.5)*25,(Math.random()-0.5)*14,-Math.random()*12);
        tool.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        tool.userData = {baseY:tool.position.y,phase:Math.random()*6,rx:(Math.random()-0.5)*0.015,ry:(Math.random()-0.5)*0.02};
        scene.add(tool); tools.push(tool);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.4));
      const pl = new THREE.PointLight(0xf97316, 2.5, 30); pl.position.set(0,0,10); scene.add(pl);
      animHooks.push((t)=>{
        tools.forEach(t2=>{t2.position.y=t2.userData.baseY+Math.sin(t+t2.userData.phase)*0.4; t2.rotation.x+=t2.userData.rx; t2.rotation.y+=t2.userData.ry;});
      });
    `
  },

  'cerrajeria': {
    label: 'Cerrajería', emoji: '🔑',
    palette: { bg1: '#0a0a0a', bg2: '#1a1a1a', accent: '#eab308', accent2: '#fbbf24' },
    headline: 'Cuando la <i>urgencia</i> llama, te encuentra.',
    sub: 'Emergencias 24h visibles, testimonios reales, teléfono click-to-call. Estar primero en Google = facturar.',
    threeScene: `
      // Llaves 3D girando
      const keys = [];
      for(let i=0;i<8;i++){
        const g = new THREE.Group();
        // Cabeza
        const head = new THREE.Mesh(new THREE.TorusGeometry(0.35,0.1,8,20), new THREE.MeshStandardMaterial({color:0xeab308,metalness:0.95,roughness:0.2}));
        g.add(head);
        // Vástago
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,1.2,8), new THREE.MeshStandardMaterial({color:0xeab308,metalness:0.95}));
        shaft.position.y = -0.75; g.add(shaft);
        // Dientes
        for(let d=0;d<3;d++){
          const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.15,0.1), new THREE.MeshStandardMaterial({color:0xeab308,metalness:0.95}));
          tooth.position.set(0.13, -1.1+d*0.15, 0);
          g.add(tooth);
        }
        g.position.set((Math.random()-0.5)*25,(Math.random()-0.5)*14,-Math.random()*12);
        g.userData = {baseY:g.position.y,phase:Math.random()*6,rz:0.01+Math.random()*0.02};
        scene.add(g); keys.push(g);
      }
      scene.add(new THREE.AmbientLight(0xffffff,0.3));
      const pl = new THREE.PointLight(0xeab308, 3, 30); pl.position.set(0,0,10); scene.add(pl);
      animHooks.push((t)=>{
        keys.forEach(k=>{k.position.y=k.userData.baseY+Math.sin(t+k.userData.phase)*0.4; k.rotation.z+=k.userData.rz;});
      });
    `
  },

  'servicios': {
    label: 'Servicios', emoji: '💼',
    palette: { bg1: '#0a0a0a', bg2: '#000000', accent: '#ff3d00', accent2: '#ff6b35' },
    headline: 'Tu <i>profesionalidad</i>, en primera línea.',
    sub: 'Casos resueltos, testimonios, confianza. La web que dice "aquí hay un pro".',
    threeScene: `
      // Wireframes flotantes (como el original)
      const wfs = [];
      for(let i=0;i<6;i++){
        const g = new THREE.Group();
        const mat = new THREE.LineBasicMaterial({color:0xff3d00,transparent:true,opacity:0.4});
        const frame = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.5,-1.5,0),new THREE.Vector3(2.5,-1.5,0),new THREE.Vector3(2.5,1.5,0),new THREE.Vector3(-2.5,1.5,0),new THREE.Vector3(-2.5,-1.5,0)]);
        g.add(new THREE.Line(frame,mat));
        for(let j=0;j<3;j++){
          const line = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2,0.8-j*0.4,0),new THREE.Vector3(2-j*0.3,0.8-j*0.4,0)]);
          g.add(new THREE.Line(line,mat));
        }
        g.position.set((Math.random()-0.5)*25,(Math.random()-0.5)*14,-Math.random()*20);
        g.userData = {baseY:g.position.y,phase:Math.random()*6};
        scene.add(g); wfs.push(g);
      }
      const grid = new THREE.GridHelper(60,40,0xff3d00,0x1a1a1a); grid.material.transparent=true; grid.material.opacity=0.1; grid.position.y=-9; scene.add(grid);
      scene.add(new THREE.AmbientLight(0xffffff,0.3));
      animHooks.push((t)=>{
        wfs.forEach(w=>{w.position.y = w.userData.baseY+Math.sin(t+w.userData.phase)*0.5; w.position.z += 0.02; if(w.position.z>10) w.position.z=-25;});
      });
    `
  },
  'sin_plantilla': { inherits: 'servicios', label: 'Profesional', emoji: '⭐' }
};

// Resolver herencias
function resolveSector(key){
  const s = SECTOR_ANIMS[key] || SECTOR_ANIMS['servicios'];
  if(s.inherits){
    const parent = resolveSector(s.inherits);
    return Object.assign({}, parent, s);
  }
  return s;
}

// ======== PLANTILLA HTML ========
function makeHTML(lead, config){
  const name = lead.nombre || 'Tu Negocio';
  const city = lead.ciudad || '';
  const rating = lead.google_rating || 4.8;
  const reviews = lead.google_reviews || 0;
  const tel = lead.telefono || '';
  const email = lead.email || '';
  const address = lead.direccion || '';
  const desc = (lead.descripcion || '').slice(0, 200);
  const textColor = config.invertTheme ? (config.palette.textOnBg || '#0a0a0a') : '#ffffff';
  const cardBg = config.invertTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)';
  const cardBorder = config.invertTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${name} · ${config.label} en ${city}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{overflow-x:hidden;background:linear-gradient(180deg,${config.palette.bg1},${config.palette.bg2});color:${textColor};font-family:'Inter',sans-serif;min-height:100vh}
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:22px 42px;display:flex;justify-content:space-between;align-items:center;background:${config.invertTheme?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.5)'};backdrop-filter:blur(14px);border-bottom:1px solid ${cardBorder}}
.logo{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:19px;letter-spacing:-0.5px;display:flex;align-items:center;gap:10px}
.logo-dot{width:10px;height:10px;background:${config.palette.accent};border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:0.6}}
.nav-cta{background:${config.palette.accent};color:#fff;padding:10px 22px;border-radius:40px;font-weight:600;text-decoration:none;font-size:14px;transition:all 0.2s}
.nav-cta:hover{transform:translateY(-1px);filter:brightness(1.1)}
.hero{position:relative;min-height:100vh;display:flex;align-items:center;padding:120px 42px 80px;overflow:hidden}
#hero-canvas{position:absolute;top:0;left:0;width:100%;height:100%;z-index:1}
.hero-content{position:relative;z-index:2;max-width:1200px;margin:0 auto;width:100%}
.trust{display:inline-flex;align-items:center;gap:10px;padding:8px 16px;background:${cardBg};border:1px solid ${cardBorder};border-radius:40px;font-size:13px;margin-bottom:28px}
.trust .dot{width:6px;height:6px;background:#22c55e;border-radius:50%;box-shadow:0 0 12px #22c55e}
h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(44px,7vw,92px);font-weight:700;line-height:0.95;letter-spacing:-3px;margin-bottom:28px;max-width:900px}
h1 i{color:${config.palette.accent};font-style:italic;font-weight:500}
.hero-sub{font-size:19px;line-height:1.55;opacity:0.7;max-width:600px;margin-bottom:40px}
.ctas{display:flex;gap:14px;margin-bottom:56px;flex-wrap:wrap}
.btn-p{background:${config.palette.accent};color:#fff;padding:17px 32px;border-radius:40px;font-weight:600;font-size:15px;text-decoration:none;display:inline-flex;gap:10px;align-items:center;transition:all 0.25s;border:none;cursor:pointer}
.btn-p:hover{transform:translateY(-2px);filter:brightness(1.1);box-shadow:0 15px 35px ${config.palette.accent}66}
.btn-g{background:transparent;color:${textColor};padding:17px 28px;border-radius:40px;font-weight:500;font-size:15px;text-decoration:none;border:1px solid ${cardBorder};transition:all 0.25s}
.btn-g:hover{background:${cardBg}}
.hero-stats{display:flex;gap:48px;padding-top:32px;border-top:1px solid ${cardBorder};flex-wrap:wrap}
.stat-num{font-family:'Space Grotesk',sans-serif;font-size:36px;font-weight:700;line-height:1;margin-bottom:6px}
.stat-num b{color:${config.palette.accent}}
.stat-label{font-size:13px;opacity:0.55}
section{padding:120px 42px;position:relative}
.container{max-width:1200px;margin:0 auto}
.section-label{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:600;color:${config.palette.accent};text-transform:uppercase;letter-spacing:2px;margin-bottom:20px}
.section-label::before{content:'';width:30px;height:1px;background:${config.palette.accent}}
h2{font-family:'Space Grotesk',sans-serif;font-size:clamp(32px,5vw,62px);font-weight:700;line-height:1.05;letter-spacing:-1.5px;margin-bottom:24px;max-width:900px}
h2 i{color:${config.palette.accent};font-style:italic;font-weight:500}
.section-sub{font-size:18px;opacity:0.65;max-width:640px;line-height:1.55;margin-bottom:60px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.card{padding:30px;background:${cardBg};border:1px solid ${cardBorder};border-radius:20px;transition:all 0.3s}
.card:hover{transform:translateY(-4px);border-color:${config.palette.accent}66}
.card .num{font-family:'Space Grotesk',sans-serif;font-size:13px;color:${config.palette.accent};margin-bottom:16px;letter-spacing:1px;font-weight:600}
.card h3{font-family:'Space Grotesk',sans-serif;font-size:22px;margin-bottom:12px;letter-spacing:-0.5px;font-weight:600}
.card p{opacity:0.7;line-height:1.55;font-size:15px}
.contact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:40px}
.contact-item{padding:24px;background:${cardBg};border:1px solid ${cardBorder};border-radius:16px}
.contact-item .label{font-size:12px;opacity:0.5;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px}
.contact-item .value{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:500;color:${textColor}}
.contact-item a{color:${textColor};text-decoration:none}
.contact-item a:hover{color:${config.palette.accent}}
footer{padding:48px 42px;text-align:center;border-top:1px solid ${cardBorder};opacity:0.5;font-size:13px}
footer a{color:${textColor};text-decoration:none}
.cta-final{text-align:center;padding:140px 42px}
.cta-final h2{margin:0 auto 24px}
.cta-final .section-sub{margin:0 auto 40px}
.cta-big{display:inline-flex;align-items:center;gap:14px;background:${config.palette.accent};color:#fff;padding:22px 44px;border-radius:60px;font-size:17px;font-weight:600;text-decoration:none;transition:all 0.3s;box-shadow:0 20px 50px ${config.palette.accent}55}
.cta-big:hover{transform:translateY(-3px) scale(1.02);filter:brightness(1.1)}
.reveal{opacity:0;transform:translateY(40px)}
@media(max-width:900px){nav{padding:16px 20px}section{padding:70px 20px}.hero{padding:100px 20px 60px}.hero-stats{gap:24px}}
</style>
</head>
<body>
<nav>
  <div class="logo"><span class="logo-dot"></span>${name}</div>
  <a href="#contacto" class="nav-cta">Contactar</a>
</nav>

<section class="hero">
  <canvas id="hero-canvas"></canvas>
  <div class="hero-content">
    <div class="trust reveal"><span class="dot"></span>${config.emoji} ${config.label} en ${city || 'España'}${rating?` · ⭐ ${rating} (${reviews} reseñas)`:''}</div>
    <h1 class="reveal">${config.headline}</h1>
    <p class="hero-sub reveal">${config.sub}</p>
    <div class="ctas reveal">
      ${tel?`<a href="tel:${tel}" class="btn-p">📞 Llamar ahora</a>`:''}
      <a href="#contacto" class="btn-g">Ver contacto</a>
    </div>
    <div class="hero-stats reveal">
      ${rating?`<div><div class="stat-num"><b>${rating}</b>⭐</div><div class="stat-label">Valoración Google</div></div>`:''}
      ${reviews?`<div><div class="stat-num"><b>${reviews}</b>+</div><div class="stat-label">Reseñas reales</div></div>`:''}
      <div><div class="stat-num"><b>24</b>/7</div><div class="stat-label">Tu web siempre abierta</div></div>
    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="section-label">Lo que te ofrecemos</div>
    <h2 class="reveal">Una web <i>hecha para tu negocio</i>, no un molde genérico.</h2>
    <p class="section-sub reveal">Personalizada con tus datos reales, tus fotos, tu tono. Lista en 48 horas sin que muevas un dedo.</p>
    <div class="cards">
      <div class="card reveal"><div class="num">01</div><h3>Diseño ${config.label}</h3><p>Adaptada a tu sector con animaciones y colores que encajan. No una plantilla de WordPress más.</p></div>
      <div class="card reveal"><div class="num">02</div><h3>Tus datos reales</h3><p>Incluimos tu teléfono, tus reseñas de Google, tu ubicación. Nada inventado, nada stock.</p></div>
      <div class="card reveal"><div class="num">03</div><h3>SEO local</h3><p>Optimizada para que te encuentren cuando alguien busque ${config.label.toLowerCase()} en ${city||'tu zona'}.</p></div>
    </div>
  </div>
</section>

<section id="contacto">
  <div class="container">
    <div class="section-label">Contacto</div>
    <h2 class="reveal">Tus datos, <i>tal como están hoy</i>.</h2>
    <p class="section-sub reveal">Esto es lo que ya sabemos de ti. En la web final se verá así de claro para tus clientes.</p>
    <div class="contact-grid">
      ${tel?`<div class="contact-item reveal"><div class="label">Teléfono</div><div class="value"><a href="tel:${tel}">${tel}</a></div></div>`:''}
      ${email?`<div class="contact-item reveal"><div class="label">Email</div><div class="value"><a href="mailto:${email}">${email}</a></div></div>`:''}
      ${address?`<div class="contact-item reveal"><div class="label">Dirección</div><div class="value">${address}</div></div>`:''}
      ${city?`<div class="contact-item reveal"><div class="label">Ciudad</div><div class="value">${city}</div></div>`:''}
    </div>
  </div>
</section>

<section class="cta-final">
  <div class="container">
    <div class="section-label" style="justify-content:center">${config.emoji} ${name}</div>
    <h2 class="reveal">¿Quieres <i>esta web</i> de verdad?</h2>
    <p class="section-sub reveal">Podemos tenerla lista y en marcha en 7 días con dominio, hosting y tus textos reales.</p>
    <a href="mailto:info@ggelcano.com?subject=Quiero la web de ${encodeURIComponent(name)}" class="cta-big reveal">Hablemos — info@ggelcano.com</a>
  </div>
</section>

<footer>
  Demo creada por <a href="https://github.com/ggeelcano">G&G Elcano</a> para ${name} · ${city||'España'} · 2026
</footer>

<script>
gsap.registerPlugin(ScrollTrigger);
const animHooks = [];
(() => {
  const canvas = document.getElementById('hero-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 200);
  camera.position.z = 22;
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  ${config.threeScene}
  const mouse = {x:0, y:0};
  window.addEventListener('mousemove', e => {mouse.x=(e.clientX/window.innerWidth-0.5)*2; mouse.y=-(e.clientY/window.innerHeight-0.5)*2;});
  let t=0;
  function loop(){
    requestAnimationFrame(loop);
    t += 0.015;
    animHooks.forEach(h => h(t));
    camera.position.x += (mouse.x*1.5 - camera.position.x)*0.03;
    camera.position.y += (mouse.y*1 - camera.position.y)*0.03;
    camera.lookAt(0,0,0);
    renderer.render(scene, camera);
  }
  loop();
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.to(el, {opacity:1, y:0, duration:1, ease:'power3.out', scrollTrigger:{trigger:el, start:'top 88%', once:true}});
});
gsap.timeline().to('.hero .reveal', {opacity:1, y:0, duration:0.9, stagger:0.1, ease:'power3.out', delay:0.3});
</script>
</body>
</html>`;
}

// ======== GENERAR 100 WEBS ========
console.log('Generando', leads.length, 'webs...');
const index = [];
leads.forEach((lead, i) => {
  const slug = slugify(lead.nombre) + '-' + (lead.id||'').slice(0,6);
  const dir = path.join(OUT_DIR, 'demos', slug);
  fs.mkdirSync(dir, { recursive: true });
  const config = resolveSector(lead.sector);
  const html = makeHTML(lead, config);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  index.push({slug, nombre: lead.nombre, sector: config.label, ciudad: lead.ciudad, tel: lead.telefono, rating: lead.google_rating});
  if(i%10===0) console.log(`  [${i+1}/${leads.length}] ${lead.nombre}`);
});

// Index principal
const indexHTML = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>100 Demos · G&G Elcano</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#fff;font-family:'Inter',sans-serif;padding:40px 20px}
.container{max-width:1400px;margin:0 auto}
h1{font-family:'Space Grotesk',sans-serif;font-size:56px;margin-bottom:8px;letter-spacing:-2px}
h1 i{color:#ff3d00;font-style:italic}
.sub{opacity:0.6;margin-bottom:40px;font-size:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.card{padding:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;text-decoration:none;color:#fff;transition:all 0.25s;display:block}
.card:hover{transform:translateY(-3px);border-color:#ff3d00;background:rgba(255,61,0,0.08)}
.sector{display:inline-block;padding:4px 12px;background:rgba(255,61,0,0.15);color:#ff3d00;border-radius:12px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
.card h3{font-family:'Space Grotesk',sans-serif;font-size:18px;letter-spacing:-0.5px;margin-bottom:4px;line-height:1.2}
.card .meta{opacity:0.5;font-size:13px}
.stats{display:flex;gap:40px;margin:20px 0 40px;padding:24px;background:rgba(255,255,255,0.03);border-radius:16px;flex-wrap:wrap}
.stats div strong{font-family:'Space Grotesk',sans-serif;font-size:28px;color:#ff3d00;display:block}
.stats div span{font-size:12px;opacity:0.5;text-transform:uppercase;letter-spacing:1px}
</style></head><body>
<div class="container">
<h1><i>100 demos</i> generadas por G&G Elcano</h1>
<p class="sub">Cada web tiene animaciones Three.js específicas para su sector + datos reales del negocio.</p>
<div class="stats">
  <div><strong>${leads.length}</strong><span>Webs generadas</span></div>
  <div><strong>${[...new Set(leads.map(l => l.sector))].length}</strong><span>Sectores distintos</span></div>
  <div><strong>${[...new Set(leads.map(l => l.ciudad).filter(Boolean))].length}</strong><span>Ciudades</span></div>
</div>
<div class="grid">
${index.map(d=>`<a class="card" href="./demos/${d.slug}/">
  <div class="sector">${d.sector}</div>
  <h3>${d.nombre}</h3>
  <div class="meta">${d.ciudad||''}${d.rating?` · ⭐ ${d.rating}`:''}</div>
</a>`).join('\n')}
</div>
</div></body></html>`;
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHTML);
fs.writeFileSync(path.join(OUT_DIR, 'catalog.json'), JSON.stringify(index, null, 2));
console.log('\n✅ Generadas', leads.length, 'webs en /demos/');
console.log('✅ Index creado en index.html');
console.log('✅ Catálogo en catalog.json');
