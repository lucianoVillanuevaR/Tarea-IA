# Juego de Placas Deslizables (N-Puzzle) 🧩

Este proyecto implementa el **juego de placas deslizables (N-Puzzle)** en **JavaScript (Node.js)**.  
Permite resolver el problema usando **búsquedas no informadas**:

- **BFS (Breadth-First Search / Amplitud)**
- **IDDFS (Iterative Deepening Depth-First Search / Profundidad Iterativa)**
- **Búsqueda Bidireccional**

Funciona para tableros de tamaño **N×N** (ejemplo: 3×3, 4×4, …).  
El estado inicial y la meta pueden ser **ingresados manualmente** o **generados aleatoriamente**.

---

## 📦 Requisitos

- [Node.js](https://nodejs.org/) versión 14 o superior.
- Sistema operativo con consola (Windows PowerShell, Linux bash, macOS terminal).

---
Ejecuta el programa con:

node puzzle.js

📖 Ejemplo de Ejecución
=== Juego de Placas Deslizables (BFS, IDDFS, Bidireccional) ===

Tamaño del tablero N (ej. 3 para 3x3, 4 para 4x4): 3
¿Estados manuales o aleatorios? (m/a) [a]: a
Cantidad de movimientos aleatorios desde la meta [30]: 10

Estado INICIAL (aleatorio):
 1  2  3
 4  5  6
 7     8

Estado META (estándar):
 1  2  3
 4  5  6
 7  8   

Elige algoritmos: 1) BFS  2) IDDFS  3) Bidireccional (ej: 1,3) [1]: 1,3
¿Imprimir la secuencia de tableros del camino? (s/n) [n]: s

--- BFS (Amplitud) ---
Solución encontrada. Profundidad (nº de movimientos): 2
Nodos expandidos: 5
Tiempo: 3 ms
Movimientos: R D

Camino (tableros):

Paso 0:
 1  2  3
 4  5  6
 7     8

Paso 1:
 1  2  3
 4  5  6
 7  8   

 📊 Detalles Técnicos

Representación del tablero: arreglo lineal de longitud N*N, con 0 representando el espacio en blanco.

Chequeo de resolubilidad: se implementa el cálculo de inversiones para descartar estados imposibles.

Generación aleatoria: se parte de la meta y se aplican movimientos válidos al azar, garantizando solvencia.

Algoritmos incluidos:

BFS: siempre encuentra la solución más corta en número de movimientos.

IDDFS: combina la completitud de BFS con la memoria reducida de DFS.

Bidireccional: explora desde inicio y meta simultáneamente para acelerar la búsqueda.


