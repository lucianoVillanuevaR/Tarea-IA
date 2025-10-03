// puzzle.js
// Juego de placas deslizables - Búsquedas no informadas (BFS, IDDFS, Bidireccional)
// Compatible con N×N (3x3, 4x4, ...). Ejecuta: node puzzle.js

const readline = require("readline");

// -------------------- Utilidades de tablero --------------------
function indexToRC(idx, N) {
  return { r: Math.floor(idx / N), c: idx % N };
}
function rcToIndex(r, c, N) {
  return r * N + c;
}
function clone(arr) {
  return arr.slice();
}
function arrEquals(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
function keyOf(state) {
  // clave string para Set/Map
  return state.join(",");
}
function parseState(input, N) {
  // "1 2 3 4 5 6 7 8 0" → [1,2,3,4,5,6,7,8,0]
  const nums = input
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map((x) => Number(x));
  if (nums.length !== N * N) {
    throw new Error(`Debes ingresar exactamente ${N * N} números.`);
  }
  const seen = new Set();
  for (const v of nums) {
    if (Number.isNaN(v)) throw new Error("Hay un valor no numérico.");
    if (v < 0 || v >= N * N)
      throw new Error(`Los valores deben estar entre 0 y ${N * N - 1}.`);
    if (seen.has(v)) throw new Error("Valores repetidos.");
    seen.add(v);
  }
  return nums;
}
function prettyPrint(state, N) {
  const lines = [];
  for (let r = 0; r < N; r++) {
    const row = state.slice(r * N, (r + 1) * N).map((x) => (x === 0 ? " " : x));
    lines.push(row.map((x) => String(x).padStart(2, " ")).join(" "));
  }
  return lines.join("\n");
}
function goalState(N) {
  const a = [];
  for (let i = 1; i < N * N; i++) a.push(i);
  a.push(0);
  return a;
}

// Generar sucesores (estado, movimiento)
const MOVES = [
  { dr: -1, dc: 0, name: "U" },
  { dr: 1, dc: 0, name: "D" },
  { dr: 0, dc: -1, name: "L" },
  { dr: 0, dc: 1, name: "R" },
];
function neighbors(state, N) {
  const zero = state.indexOf(0);
  const { r, c } = indexToRC(zero, N);
  const res = [];
  for (const mv of MOVES) {
    const nr = r + mv.dr;
    const nc = c + mv.dc;
    if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
      const ni = rcToIndex(nr, nc, N);
      const next = clone(state);
      // swap 0 y vecino
      next[zero] = next[ni];
      next[ni] = 0;
      res.push({ state: next, move: mv.name });
    }
  }
  return res;
}

// -------------------- Solvability (inversiones) --------------------
function countInversions(arr) {
  // cuenta inversiones ignorando el 0
  const a = arr.filter((x) => x !== 0);
  let inv = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      if (a[i] > a[j]) inv++;
    }
  }
  return inv;
}
function isSolvable(state, N, goal = goalState(N)) {
  // Para NxN:
  // - Si N impar: solvable si #inversiones(state) par.
  // - Si N par: sean inv(state) y fila del 0 contando desde abajo.
  //   Si (filaDesdeAbajo par) => inv debe ser impar.
  //   Si (filaDesdeAbajo impar) => inv debe ser par.
  // Nota: cuando meta != estándar, estrictamente hay que comparar permutaciones relativas.
  // Aquí asumimos meta estándar [1..N*N-1,0] o estados generados desde ella.
  const inv = countInversions(state);
  if (N % 2 === 1) {
    return inv % 2 === 0;
  } else {
    const zeroIndex = state.indexOf(0);
    const { r } = indexToRC(zeroIndex, N);
    const rowFromBottom = N - r; // 1..N
    if (rowFromBottom % 2 === 0) {
      return inv % 2 === 1;
    } else {
      return inv % 2 === 0;
    }
  }
}

// -------------------- Generación aleatoria válida --------------------
function scrambleFrom(goal, N, steps = 30) {
  let curr = goal.slice();
  for (let s = 0; s < steps; s++) {
    const neigh = neighbors(curr, N);
    // evitar deshacer el paso anterior trivialmente
    // (opcional; aquí elegimos un random libremente)
    const pick = neigh[Math.floor(Math.random() * neigh.length)].state;
    curr = pick;
  }
  return curr;
}

// -------------------- Reconstrucción de caminos --------------------
function reconstructPath(parents, moves, endKey) {
  const pathStates = [];
  const pathMoves = [];
  let k = endKey;
  while (k) {
    pathStates.push(parents.get(k).state);
    const mv = moves.get(k);
    if (mv) pathMoves.push(mv);
    k = parents.get(k).parentKey;
  }
  pathStates.reverse();
  pathMoves.reverse();
  return { pathStates, pathMoves };
}

// -------------------- BFS --------------------
function bfs(start, goal, N) {
  const startKey = keyOf(start);
  const goalKey = keyOf(goal);
  if (startKey === goalKey) {
    return { found: true, depth: 0, expanded: 0, pathStates: [start], pathMoves: [] };
  }
  const q = [start];
  const visited = new Set([startKey]);
  const parents = new Map(); // key -> {parentKey, state}
  const moves = new Map();   // key -> move from parent to this
  parents.set(startKey, { parentKey: null, state: start });
  let expanded = 0;

  while (q.length) {
    const curr = q.shift();
    const currKey = keyOf(curr);
    if (currKey === goalKey) {
      const { pathStates, pathMoves } = reconstructPath(parents, moves, currKey);
      return { found: true, depth: pathMoves.length, expanded, pathStates, pathMoves };
    }
    expanded++;
    for (const { state: nxt, move } of neighbors(curr, N)) {
      const nk = keyOf(nxt);
      if (!visited.has(nk)) {
        visited.add(nk);
        parents.set(nk, { parentKey: currKey, state: nxt });
        moves.set(nk, move);
        q.push(nxt);
      }
    }
  }
  return { found: false, depth: -1, expanded };
}

// -------------------- IDDFS (DFS con límite + profundización) --------------------
function dls(node, goalKey, N, limit, pathSet, parents, moves, stats) {
  const k = keyOf(node);
  if (k === goalKey) return { found: true, endKey: k };
  if (limit === 0) return { found: false };

  stats.expanded++;
  for (const { state: nxt, move } of neighbors(node, N)) {
    const nk = keyOf(nxt);
    if (pathSet.has(nk)) continue; // evita ciclos en la ruta actual
    parents.set(nk, { parentKey: k, state: nxt });
    moves.set(nk, move);
    pathSet.add(nk);
    const res = dls(nxt, goalKey, N, limit - 1, pathSet, parents, moves, stats);
    if (res.found) return res;
    pathSet.delete(nk);
  }
  return { found: false };
}
function iddfs(start, goal, N, maxDepth = 80) {
  const goalKey = keyOf(goal);
  if (keyOf(start) === goalKey) {
    return { found: true, depth: 0, expanded: 0, pathStates: [start], pathMoves: [] };
  }
  // Intentos de límites crecientes
  for (let limit = 0; limit <= maxDepth; limit++) {
    const parents = new Map();
    const moves = new Map();
    const pathSet = new Set([keyOf(start)]);
    parents.set(keyOf(start), { parentKey: null, state: start });
    const stats = { expanded: 0 };
    const res = dls(start, goalKey, N, limit, pathSet, parents, moves, stats);
    if (res.found) {
      const { pathStates, pathMoves } = reconstructPath(parents, moves, res.endKey);
      return { found: true, depth: pathMoves.length, expanded: stats.expanded, pathStates, pathMoves };
    }
  }
  return { found: false, depth: -1, expanded: 0 };
}

// -------------------- Bidireccional (dos BFS) --------------------
function buildPathFromMeet(
  meetKey,
  parentsF, movesF, // desde inicio
  parentsB, movesB  // desde meta (reversa)
) {
  // Camino inicio -> meet
  const left = reconstructPath(parentsF, movesF, meetKey);
  // Camino meta -> meet (tenemos padres “al revés”), reconstruimos y luego invertimos
  const right = reconstructPath(parentsB, movesB, meetKey);
  // right devuelve camino meta->...->meet, lo invertimos y convertimos movimientos
  right.pathStates.reverse();
  right.pathMoves.reverse();
  // Para movimientos de la parte derecha debemos invertir (U<->D, L<->R) porque vienen del reverse
  const inv = { U: "D", D: "U", L: "R", R: "L" };
  const rightMovesAdjusted = right.pathMoves.map((m) => inv[m]);

  // Unimos, evitando duplicar el meet
  const pathStates = left.pathStates.concat(right.pathStates.slice(1));
  const pathMoves = left.pathMoves.concat(rightMovesAdjusted);
  return { pathStates, pathMoves };
}

function bidirectional(start, goal, N) {
  const startKey = keyOf(start);
  const goalKey = keyOf(goal);
  if (startKey === goalKey) {
    return { found: true, depth: 0, expanded: 0, pathStates: [start], pathMoves: [] };
  }

  const qF = [start], qB = [goal];
  const visitedF = new Set([startKey]);
  const visitedB = new Set([goalKey]);

  const parentsF = new Map([[startKey, { parentKey: null, state: start }]]);
  const parentsB = new Map([[goalKey, { parentKey: null, state: goal }]]);
  const movesF = new Map();
  const movesB = new Map();

  let expanded = 0;

  while (qF.length && qB.length) {
    // Expandir un paso adelante (desde inicio)
    {
      const size = qF.length;
      for (let s = 0; s < size; s++) {
        const curr = qF.shift();
        const currKey = keyOf(curr);
        expanded++;
        for (const { state: nxt, move } of neighbors(curr, N)) {
          const nk = keyOf(nxt);
          if (!visitedF.has(nk)) {
            visitedF.add(nk);
            parentsF.set(nk, { parentKey: currKey, state: nxt });
            movesF.set(nk, move);
            if (visitedB.has(nk)) {
              // ¡Se encontraron!
              const { pathStates, pathMoves } = buildPathFromMeet(nk, parentsF, movesF, parentsB, movesB);
              return { found: true, depth: pathMoves.length, expanded, pathStates, pathMoves };
            }
            qF.push(nxt);
          }
        }
      }
    }
    // Expandir un paso atrás (desde meta)
    {
      const size = qB.length;
      for (let s = 0; s < size; s++) {
        const curr = qB.shift();
        const currKey = keyOf(curr);
        expanded++;
        for (const { state: nxt, move } of neighbors(curr, N)) {
          const nk = keyOf(nxt);
          if (!visitedB.has(nk)) {
            visitedB.add(nk);
            parentsB.set(nk, { parentKey: currKey, state: nxt });
            // Nota: move aquí es el movimiento desde "curr" hacia nxt,
            // pero en el sentido reverse lo almacenamos tal cual y luego ajustamos al reconstruir.
            movesB.set(nk, move);
            if (visitedF.has(nk)) {
              const { pathStates, pathMoves } = buildPathFromMeet(nk, parentsF, movesF, parentsB, movesB);
              return { found: true, depth: pathMoves.length, expanded, pathStates, pathMoves };
            }
            qB.push(nxt);
          }
        }
      }
    }
  }
  return { found: false, depth: -1, expanded };
}

// -------------------- CLI Interactiva --------------------
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise((res) => rl.question(q, (ans) => res(ans.trim())));
}

(async function main() {
  console.log("=== Juego de Placas Deslizables (BFS, IDDFS, Bidireccional) ===\n");

  const N = Number(await ask("Tamaño del tablero N (ej. 3 para 3x3, 4 para 4x4): "));
  if (!Number.isInteger(N) || N < 3) {
    console.log("N inválido. Debe ser entero ≥ 3.");
    rl.close(); return;
  }

  const modo = (await ask("¿Estados manuales o aleatorios? (m/a) [a]: ")) || "a";
  let start, goal;

  if (modo.toLowerCase() === "m") {
    console.log(`\nIngresa el estado INICIAL con ${N * N} números (0 es el blanco).`);
    console.log(`Ejemplo 3x3: 1 2 3 4 5 6 7 0 8`);
    try {
      start = parseState(await ask("> inicial: "), N);
    } catch (e) {
      console.log("Error:", e.message); rl.close(); return;
    }

    const metaOp = (await ask("¿Usar meta estándar [1..,0]? (s/n) [s]: ")) || "s";
    if (metaOp.toLowerCase() === "s") {
      goal = goalState(N);
    } else {
      console.log(`\nIngresa el estado META con ${N * N} números (0 es el blanco).`);
      try {
        goal = parseState(await ask("> meta: "), N);
      } catch (e) {
        console.log("Error:", e.message); rl.close(); return;
      }
    }
    // Advertencia de solvencia
    if (!isSolvable(start, N, goal)) {
      console.log("\n⚠️ El estado inicial parece NO ser resoluble respecto de la meta estándar.\n" +
                  "Si estás usando una meta distinta o tus estados vienen de mezcla real, ignora este aviso.\n");
    }
  } else {
    goal = goalState(N);
    const pasos = Number(await ask("Cantidad de movimientos aleatorios desde la meta [30]: ")) || 30;
    start = scrambleFrom(goal, N, pasos);
    console.log("\nEstado INICIAL (aleatorio):\n" + prettyPrint(start, N));
    console.log("\nEstado META (estándar):\n" + prettyPrint(goal, N) + "\n");
  }

  const algos = (await ask("Elige algoritmos: 1) BFS  2) IDDFS  3) Bidireccional  (ej: 1,3) [1]: ")) || "1";
  const wantPath = (await ask("¿Imprimir la secuencia de tableros del camino? (s/n) [n]: ")) || "n";

  const runList = new Set(
    algos.split(/[,\s]+/).filter(Boolean).map((x) => Number(x))
  );

  async function runAlgo(name, fn) {
    console.log(`\n--- ${name} ---`);
    const t0 = Date.now();
    const res = fn(start, goal, N);
    const ms = Date.now() - t0;
    if (!res.found) {
      console.log("No se encontró solución.");
      console.log(`Nodos expandidos: ${res.expanded ?? "?"}, Tiempo: ${ms} ms`);
      return;
    }
    console.log(`Solución encontrada. Profundidad (nº de movimientos): ${res.depth}`);
    console.log(`Nodos expandidos: ${res.expanded}`);
    console.log(`Tiempo: ${ms} ms`);
    console.log(`Longitud del camino: ${res.pathMoves.length} movimientos`);
    console.log(`Movimientos: ${res.pathMoves.join(" ") || "(vacío)"}`);
    if (wantPath.toLowerCase() === "s") {
      console.log("\nCamino (tableros):");
      res.pathStates.forEach((st, i) => {
        console.log(`\nPaso ${i}:`);
        console.log(prettyPrint(st, N));
      });
    }
  }

  if (runList.has(1)) await runAlgo("BFS (Amplitud)", bfs);
  if (runList.has(2)) await runAlgo("IDDFS (Profundidad Iterativa)", (s, g, n) => iddfs(s, g, n, 100)); // límite 100 por defecto
  if (runList.has(3)) await runAlgo("Búsqueda Bidireccional", bidirectional);

  console.log("\nListo. ¡Éxitos en la entrega!");
  rl.close();
})().catch((e) => {
  console.error("Error inesperado:", e);
  process.exit(1);
});

