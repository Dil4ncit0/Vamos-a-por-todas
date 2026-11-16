/* =====================================================================
   CONFIGURACIÓN
   ===================================================================== */
const CONFIG = {
  // Correo que recibe la confirmación de que han aceptado
  correoAdmin: 'dilancito0703@gmail.com',

  // Veces que hay que pulsar "No" para que desaparezca
  maxNo: 30,

  // Textos del correo. Lo reciben las dos partes: tú como confirmación
  // (incluye el correo de quien aceptó) y quien acepta como agradecimiento.
  asuntoCorreo: '¡Ha dicho que sí!',
  mensajeUsuario:
    'Nos alegra mucho que haya aceptado. Gracias por contar con nosotros una vez mas, ' +
    'haremos que no se decepcione de su eleccion',

  // Cuánto cambian los botones en cada "No"
  crecimientoSi: 0.06, // rem que crece el "Sí" por cada "No"
  reduccionNo: 0.97,   // factor por el que se multiplica el tamaño del "No"
  minimoNo: 0.55,      // tamaño mínimo del "No" en rem, para que se pueda pulsar

  // Collage: las fotos salen de la carpeta "memes" (junto a index.html).
  // Opción 1 (sin tocar nada aquí): nombra los archivos 1, 2, 3... seguidos,
  //   con cualquiera de las extensiones de abajo: 1.jpg, 2.png, 3.gif...
  // Opción 2: deja los nombres que quieras y escríbelos en esta lista:
  //   memes: ['gato-llorando.jpg', 'perro triste.png'],
  carpetaMemes: 'memes',
  memes: [],
  extensionesMemes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  maxMemesNumerados: 100,
};

/* =====================================================================
   NAVEGACIÓN ENTRE PASOS
   El paso actual vive en la URL (?paso=...), así cada cambio de paso
   recarga la página de verdad.
   ===================================================================== */
const PASOS = ['pregunta', 'solosi', 'correo'];

function pasoActual() {
  const paso = new URLSearchParams(location.search).get('paso');
  return PASOS.includes(paso) ? paso : 'pregunta';
}

function irA(paso) {
  const url = new URL(location.href);
  url.searchParams.set('paso', paso);
  location.href = url.toString(); // recarga la página en el nuevo paso
}

function mostrar(idVista) {
  document.querySelectorAll('.vista').forEach((v) => { v.hidden = v.id !== idVista; });
}

/* =====================================================================
   PASO 1: LA PREGUNTA
   ===================================================================== */
const btnSi = document.getElementById('btn-si');
const btnNo = document.getElementById('btn-no');
const collage = document.getElementById('collage');

let vecesNo = 0;

function iniciarPregunta(soloSi) {
  mostrar('vista-pregunta');
  btnSi.addEventListener('click', () => irA('correo'));

  if (soloSi) {
    // Tras 30 "No": el "No" desaparece y en su lugar hay otro "Sí"
    const otroSi = btnSi.cloneNode(true);
    otroSi.id = 'btn-si-2';
    otroSi.addEventListener('click', () => irA('correo'));
    btnNo.replaceWith(otroSi);
    return;
  }

  btnNo.addEventListener('click', alPulsarNo);
  memesDisponibles = buscarMemes(); // deja la lista preparada antes del primer "No"
}

function alPulsarNo() {
  vecesNo += 1;

  // "Sí" un pelín más grande, "No" un pelín más pequeño
  btnSi.style.fontSize = `${1.1 + vecesNo * CONFIG.crecimientoSi}rem`;
  const tamNo = Math.max(1.1 * Math.pow(CONFIG.reduccionNo, vecesNo), CONFIG.minimoNo);
  btnNo.style.fontSize = `${tamNo}rem`;
  moverNo();

  agregarFoto();

  if (vecesNo >= CONFIG.maxNo) {
    btnNo.disabled = true;
    setTimeout(() => irA('solosi'), 600);
  }
}

// Lleva el botón "No" a un punto al azar de toda la pantalla
function moverNo() {
  const caja = btnNo.getBoundingClientRect();
  const margen = 12;

  if (!btnNo.classList.contains('suelto')) {
    // Primera vez: se deja un hueco invisible del mismo tamaño para que
    // la frase y el "Sí" no den un salto, y el botón pasa a flotar.
    const hueco = document.createElement('span');
    hueco.style.cssText = `display:inline-block;width:${caja.width}px;height:${caja.height}px`;
    btnNo.after(hueco);
    btnNo.style.left = `${caja.left}px`;
    btnNo.style.top = `${caja.top}px`;
    btnNo.classList.add('suelto');
    document.body.appendChild(btnNo);
    btnNo.getBoundingClientRect(); // fija el punto de partida de la animación
  }

  const maxX = Math.max(margen, window.innerWidth - caja.width - margen);
  const maxY = Math.max(margen, window.innerHeight - caja.height - margen);
  btnNo.style.left = `${azar(margen, maxX)}px`;
  btnNo.style.top = `${azar(margen, maxY)}px`;
}

/* =====================================================================
   COLLAGE DE MEMES
   Cada "No" añade una foto de la carpeta "memes" con tamaño, posición y
   giro al azar. No se repite ninguna hasta que han salido todas.
   ===================================================================== */
const azar = (min, max) => Math.random() * (max - min) + min;
const entero = (min, max) => Math.floor(azar(min, max + 1));
const elegir = (lista) => lista[entero(0, lista.length - 1)];

function cargarImagen(url) {
  return new Promise((ok, fallo) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => fallo(new Error(`No cargó ${url}`));
    img.src = url;
  });
}

const rutaMeme = (nombre) => `${CONFIG.carpetaMemes}/${encodeURIComponent(nombre)}`;

// Devuelve las direcciones de todas las fotos disponibles en la carpeta
async function buscarMemes() {
  // Opción 2: lista escrita a mano en CONFIG.memes
  if (CONFIG.memes.length) return CONFIG.memes.map(rutaMeme);

  // Opción 1: archivos numerados 1, 2, 3... hasta el primero que falte
  const encontrados = [];
  for (let n = 1; n <= CONFIG.maxMemesNumerados; n += 1) {
    let url = null;
    for (const ext of CONFIG.extensionesMemes) {
      try {
        await cargarImagen(rutaMeme(`${n}.${ext}`));
        url = rutaMeme(`${n}.${ext}`);
        break;
      } catch (error) { /* se prueba la siguiente extensión */ }
    }
    if (!url) break;
    encontrados.push(url);
  }
  if (!encontrados.length) {
    console.warn(`No hay fotos en la carpeta "${CONFIG.carpetaMemes}". ` +
                 'Nómbralas 1.jpg, 2.jpg... o escribe sus nombres en CONFIG.memes.');
  }
  return encontrados;
}

let memesDisponibles = null; // promesa con la lista, se pide una sola vez
let memesPorSalir = [];

async function siguienteMeme() {
  if (!memesDisponibles) memesDisponibles = buscarMemes();
  const todos = await memesDisponibles;
  if (!todos.length) throw new Error('Sin fotos en la carpeta de memes');

  // Baraja de nuevo cuando ya han salido todas
  if (!memesPorSalir.length) memesPorSalir = [...todos].sort(() => Math.random() - 0.5);
  return cargarImagen(memesPorSalir.pop());
}

function agregarFoto() {
  siguienteMeme()
    .then((img) => {
      const anchoVentana = window.innerWidth;
      const altoVentana = window.innerHeight;
      const base = Math.min(anchoVentana, altoVentana);

      // Tamaño al azar, respetando la proporción original de la foto
      const proporcion = img.naturalHeight / img.naturalWidth || 1;
      const lado = azar(base * 0.24, base * 0.5);
      const ancho = proporcion > 1 ? lado / proporcion : lado;
      const alto = ancho * proporcion;

      img.className = 'foto';
      img.alt = '';
      img.style.width = `${ancho}px`;
      img.style.height = `${alto}px`;
      // Posición al azar (puede asomar un poco por los bordes)
      img.style.left = `${azar(-ancho * 0.2, anchoVentana - ancho * 0.8)}px`;
      img.style.top = `${azar(-alto * 0.2, altoVentana - alto * 0.8)}px`;
      img.style.rotate = `${azar(-30, 30).toFixed(1)}deg`;
      img.style.zIndex = String(entero(1, 50));

      collage.appendChild(img);
    })
    .catch((error) => console.warn(error.message));
}

/* =====================================================================
   PASO 2: FORMULARIO DE CORREO
   ===================================================================== */
const form = document.getElementById('form-correo');
const inputCorreo = document.getElementById('correo');
const errorCorreo = document.getElementById('error-correo');
const btnOkay = document.getElementById('btn-okay');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function correoValido(correo) {
  return correo.length <= 254 && REGEX_CORREO.test(correo) && inputCorreo.checkValidity();
}

function mostrarError(texto) {
  errorCorreo.textContent = texto;
  errorCorreo.hidden = !texto;
  inputCorreo.classList.toggle('invalido', Boolean(texto));
}

function iniciarCorreo() {
  mostrar('vista-correo');
  inputCorreo.focus();
  inputCorreo.addEventListener('input', () => mostrarError(''));

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const correo = inputCorreo.value.trim();

    if (!correoValido(correo)) {
      mostrarError('Introduce un correo electrónico válido, por favor.');
      return;
    }

    mostrarError('');
    btnOkay.disabled = true;
    btnOkay.textContent = 'Enviando...';

    try {
      await enviarCorreos(correo);
      mostrar('vista-gracias');
      lanzarConfeti();
    } catch (error) {
      console.error(error);
      mostrarError(explicarError(error));
      btnOkay.disabled = false;
      btnOkay.textContent = 'Okay';
    }
  });
}

/* =====================================================================
   ENVÍO DE CORREOS (FormSubmit.co)
   Una sola petición hace llegar el correo a las dos partes:
     - CONFIG.correoAdmin lo recibe como confirmación de que han aceptado
       (incluye el correo de quien aceptó).
     - El correo introducido lo recibe en copia (_cc) con el mensaje de
       agradecimiento, y además se le pide a FormSubmit la respuesta
       automática (_autoresponse) con ese mismo texto.
   ===================================================================== */
function explicarError(error) {
  const detalle = String((error && error.message) || '');

  if (location.protocol === 'file:' || /web server/i.test(detalle)) {
    return 'La página está abierta como archivo (file://). Ábrela desde un servidor web ' +
           '(por ejemplo, Live Server de VS Code) para poder enviar correos.';
  }
  if (/activat/i.test(detalle)) {
    return `Falta activar el formulario: abre el correo de FormSubmit que ha llegado a ` +
           `${CONFIG.correoAdmin} (mira también en spam), pulsa "Activate Form" y vuelve a intentarlo.`;
  }
  if (error instanceof TypeError) {
    return 'No se pudo conectar con el servicio de correo. Revisa tu conexión o desactiva ' +
           'el bloqueador de anuncios e inténtalo de nuevo.';
  }
  return `No se pudo enviar el correo: ${detalle || 'error desconocido'}`;
}

async function enviarCorreos(correoUsuario) {
  if (location.protocol === 'file:') {
    throw new Error('web server');
  }

  const resp = await fetch(`https://formsubmit.co/ajax/${CONFIG.correoAdmin}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: CONFIG.asuntoCorreo,
      _template: 'box',
      _captcha: 'false',
      _cc: correoUsuario,
      _autoresponse: CONFIG.mensajeUsuario,
      email: correoUsuario,
      Mensaje: CONFIG.mensajeUsuario,
      Respuesta: 'SÍ, quiere volver a ser tu mujer para siempre',
      Fecha: new Date().toLocaleString('es-ES'),
    }),
  });

  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok || String(datos.success) !== 'true') {
    throw new Error(datos.message || `FormSubmit devolvió ${resp.status}`);
  }
}

/* =====================================================================
   CONFETI DE FONDO
   Se dibuja en un <canvas> detrás de la pantalla: una explosión inicial
   desde abajo y después una lluvia continua desde arriba.
   ===================================================================== */
function lanzarConfeti() {
  const canvas = document.getElementById('confeti');
  const ctx = canvas.getContext('2d');
  const COLORES = ['#e63965', '#ff8fab', '#ffd166', '#06d6a0', '#4cc9f0', '#9b5de5', '#ffffff'];
  const piezas = [];
  let ancho = 0;
  let alto = 0;

  function ajustar() {
    const escala = window.devicePixelRatio || 1;
    ancho = window.innerWidth;
    alto = window.innerHeight;
    canvas.width = ancho * escala;
    canvas.height = alto * escala;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  function nuevaPieza(explosion) {
    return {
      x: explosion ? ancho / 2 + azar(-60, 60) : azar(0, ancho),
      y: explosion ? alto + 10 : azar(-alto * 0.3, -10),
      vx: explosion ? azar(-9, 9) : azar(-1, 1),
      vy: explosion ? azar(-22, -9) : azar(1.5, 4),
      w: azar(6, 12),
      h: azar(8, 18),
      color: elegir(COLORES),
      giro: azar(0, Math.PI * 2),
      vGiro: azar(-0.2, 0.2),
      vaiven: azar(0, Math.PI * 2),
      redonda: Math.random() < 0.25,
    };
  }

  for (let i = 0; i < 180; i += 1) piezas.push(nuevaPieza(true));
  for (let i = 0; i < 140; i += 1) piezas.push(nuevaPieza(false));

  function fotograma() {
    ctx.clearRect(0, 0, ancho, alto);

    piezas.forEach((p, i) => {
      p.vy = Math.min(p.vy + 0.18, 4.5);          // gravedad con velocidad máxima
      p.vx *= 0.985;                              // rozamiento del aire
      p.vaiven += 0.05;
      p.x += p.vx + Math.sin(p.vaiven) * 0.8;
      p.y += p.vy;
      p.giro += p.vGiro;

      // Al salir por abajo, la pieza vuelve a caer desde arriba
      if (p.y > alto + 20) piezas[i] = nuevaPieza(false);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.scale(1, Math.cos(p.vaiven * 2));       // efecto de voltereta
      ctx.fillStyle = p.color;
      if (p.redonda) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });

    requestAnimationFrame(fotograma);
  }
  requestAnimationFrame(fotograma);
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */
switch (pasoActual()) {
  case 'correo': iniciarCorreo(); break;
  case 'solosi': iniciarPregunta(true); break;
  default: iniciarPregunta(false);
}
