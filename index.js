let tablero = []; 
let pilaDeshacer = [];
let pilaRehacer = [];
let tiempoTranscurrido = 0;
let temporizador = null;

const LS_TABLERO = "sudoku_tablero";
const LS_TIEMPO = "sudoku_tiempo";
const LS_HISTORIAL = "sudoku_historial";

const DEMO = {
  facil: [
    "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79"
  ],
  medio: [
    "...2.6..3.85...9..2....1..8.6..5....3..7..2....4..1.6..1....4..9..3...52..8.6..."
  ],
  dificil: [
    ".....6....59.....82....8....8.2.7..1.6.....4.2..4.5....8....93.....1.79....3....."
  ]
};

function tableroVacio() {
  return Array.from({length:9},()=>Array(9).fill(0));
}

function pintarTablero(t, prellenado=false) {
  const celdas = document.querySelectorAll(".su");
  for (let f=0; f<9; f++) {
    for (let c=0; c<9; c++) {
      let valor = t[f][c]===0 ? "" : t[f][c];
      let celda = celdas[f*9+c];
      celda.value = valor;

      if (prellenado && valor!=="") {
        celda.classList.add("prefilled");
        celda.disabled = true; 
      } else {
        celda.classList.remove("prefilled");
        celda.disabled = false;
      }
    }
  }
  actualizarVacias();
}


function leerTablero() {
  const celdas = document.querySelectorAll(".su");
  let t = tableroVacio();
  for (let f=0; f<9; f++) {
    for (let c=0; c<9; c++) {
      let v = celdas[f*9+c].value;
      t[f][c] = v ? Number(v) : 0;
    }
  }
  return t;
}

function actualizarVacias() {
  tablero = leerTablero();
  let vacias = tablero.flat().filter(x=>x===0).length;
  document.getElementById("empties").textContent = vacias;
}

function esColocacionValida(t,f,c,num) {
  for (let i=0; i<9; i++) {
    if (t[f][i]===num || t[i][c]===num) return false;
  }
  let bf=Math.floor(f/3)*3, bc=Math.floor(c/3)*3;
  for (let ff=bf; ff<bf+3; ff++) {
    for (let cc=bc; cc<bc+3; cc++) {
      if (t[ff][cc]===num) return false;
    }
  }
  return true;
}

function esTableroValido(t) {
  for (let f=0; f<9; f++) {
    for (let c=0; c<9; c++) {
      let v = t[f][c];
      if (v!==0) {
        t[f][c]=0;
        if (!esColocacionValida(t,f,c,v)) return false;
        t[f][c]=v;
      }
    }
  }
  return true;
}

function solveSudoku(t) {
  function buscarVacia(t) {
    for (let f=0; f<9; f++) 
      for (let c=0; c<9; c++) 
        if (t[f][c]===0) return [f,c];
    return null;
  }
  let pasos=0;
  function retroceso() {
    let hueco=buscarVacia(t);
    if (!hueco) return true;
    let [f,c]=hueco;
    for (let n=1;n<=9;n++) {
      if (esColocacionValida(t,f,c,n)) {
        t[f][c]=n; pasos++;
        if (retroceso()) return true;
        t[f][c]=0;
      }
    }
    return false;
  }
  let resuelto=retroceso();
  return {ok:resuelto,pasos};
}

function guardarDeshacer() {
  pilaDeshacer.push(JSON.stringify(leerTablero()));
  localStorage.setItem(LS_HISTORIAL, JSON.stringify({undo:pilaDeshacer, redo:pilaRehacer}));
  localStorage.setItem(LS_TABLERO, JSON.stringify(leerTablero()));
}

function deshacer() {
  if (pilaDeshacer.length>1) {
    let actual=pilaDeshacer.pop();
    pilaRehacer.push(actual);
    let anterior=JSON.parse(pilaDeshacer[pilaDeshacer.length-1]);
    pintarTablero(anterior,true);
    localStorage.setItem(LS_HISTORIAL, JSON.stringify({undo:pilaDeshacer, redo:pilaRehacer}));
  }
}

function rehacer() {
  if (pilaRehacer.length>0) {
    let siguiente=JSON.parse(pilaRehacer.pop());
    pilaDeshacer.push(JSON.stringify(siguiente));
    pintarTablero(siguiente,true);
    localStorage.setItem(LS_HISTORIAL, JSON.stringify({undo:pilaDeshacer, redo:pilaRehacer}));
  }
}

function formatearTiempo(s) {
  let m=Math.floor(s/60), ss=s%60;
  return String(m).padStart(2,"0")+":"+String(ss).padStart(2,"0");
}
function actualizarReloj() {
  document.getElementById("clock").textContent=formatearTiempo(tiempoTranscurrido);
}
function iniciarTemporizador() {
  if (temporizador) return;
  temporizador=setInterval(()=>{
    tiempoTranscurrido++;
    actualizarReloj();
    localStorage.setItem(LS_TIEMPO,tiempoTranscurrido);
  },1000);
}
function pausarTemporizador() { clearInterval(temporizador); temporizador=null; }
function reiniciarTemporizador() { pausarTemporizador(); tiempoTranscurrido=0; actualizarReloj(); localStorage.setItem(LS_TIEMPO,0); }

function mostrarMensaje(txt,tipo="") {
  let m=document.getElementById("message");
  m.className="msg "+tipo;
  m.textContent=txt;
}

document.getElementById("btnValidate").onclick=function(){
  let t=leerTablero();
  if (!esTableroValido(t)) mostrarMensaje("El tablero es inválido","error");
  else mostrarMensaje("Tablero válido hasta ahora","ok");
};

document.getElementById("btnSolve").onclick=function(){
  let t=leerTablero();
  if (!esTableroValido(t)) return mostrarMensaje("El tablero es inválido","error");
  let copia=JSON.parse(JSON.stringify(t));
  let t0=performance.now();
  let res=solveSudoku(copia);
  let ms=performance.now()-t0;
  if (!res.ok) mostrarMensaje("No se pudo resolver","warn");
  else {
    pintarTablero(copia,true);
    mostrarMensaje("Resuelto en "+res.pasos+" pasos · "+ms.toFixed(1)+"ms","ok");
  }
};

document.getElementById("btnClear").onclick=function(){
  tablero=tableroVacio();
  pintarTablero(tablero);
  mostrarMensaje("Tablero limpio","");
};

document.getElementById("btnUndo").onclick=deshacer;
document.getElementById("btnRedo").onclick=rehacer;

document.getElementById("btnRestore").onclick=function(){
  let guardado=localStorage.getItem(LS_TABLERO);
  if (guardado) pintarTablero(JSON.parse(guardado),true);
};
document.getElementById("btnForget").onclick=function(){
  localStorage.clear(); mostrarMensaje("Datos borrados","warn");
};

document.getElementById("btnGenerate").onclick = function () {
  let dif = document.getElementById("difficulty").value;
  let lista = DEMO[dif];
  if (!lista) return;

  let cadena = lista[0];
  let t = tableroVacio();
  for (let i = 0; i < 81; i++) {
    t[Math.floor(i / 9)][i % 9] = cadena[i] === "." ? 0 : Number(cadena[i]);
  }

  pintarTablero(t, true);

  mostrarMensaje("Ya puedes jugar", "ok");
};


document.getElementById("btnStart").onclick=iniciarTemporizador;
document.getElementById("btnPause").onclick=pausarTemporizador;
document.getElementById("btnReset").onclick=reiniciarTemporizador;

function iniciar() {
  const grid = document.getElementById("grid");
  for (let f = 0; f < 9; f++) {
    for (let c = 0; c < 9; c++) {
      let input = document.createElement("input");
      input.className = "su";
      input.maxLength = 1;
      input.disabled = true; 
      input.oninput = () => { actualizarVacias(); guardarDeshacer(); };
      grid.appendChild(input);
    }
  }
  tablero = tableroVacio();
  pintarTablero(tablero);
  actualizarReloj();
  guardarDeshacer();
}

iniciar();
