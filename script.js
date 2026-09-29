// ==================== HUB / SCREEN SWITCHING ====================

// ---------- 1. Grab elements from the page ----------
const startScreen  = document.getElementById('start-screen');
const hubScreen     = document.getElementById('hub-screen');
const startBtn      = document.getElementById('start-btn');
const ttcScreen     = document.getElementById('tictactoe-screen');
const memoryScreen  = document.getElementById('memory-screen');
const snakeScreen   = document.getElementById('snake-screen');
// ---------- 2. A function that switches screens ----------
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ---------- 3. Press Start (click or Enter key) ----------
startBtn.addEventListener('click', () => showScreen(hubScreen));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && startScreen.classList.contains('active')) {
    showScreen(hubScreen);
  }
});

// ---------- 4. High scores (saved in the browser) ----------
function loadScores() {
  ['snake', 'tictactoe', 'memory'].forEach(game => {
    const saved = localStorage.getItem('hs-' + game) || 0;
    document.getElementById('hs-' + game).textContent = saved;
  });
}
loadScores();

// ---------- 5. Game cards: open the right game screen ----------
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => {
    const game = card.dataset.game;
    if (game === 'tictactoe') {
      showScreen(ttcScreen);
      resetTTT();
    } else if (game === 'memory') {
      showScreen(memoryScreen);
      resetMemory();
    } else if (game === 'snake') {
      showScreen(snakeScreen);
      startSnake();
    } else {
      alert(game + ' coming soon!');
    }
  });
});

document.getElementById('ttt-back').addEventListener('click', () => showScreen(hubScreen));
document.getElementById('ttt-restart').addEventListener('click', resetTTT);

document.getElementById('memory-back').addEventListener('click', () => showScreen(hubScreen));
document.getElementById('memory-restart').addEventListener('click', resetMemory);

document.getElementById('snake-back').addEventListener('click', () => {
  stopSnake();
  showScreen(hubScreen);
});
document.getElementById('snake-restart').addEventListener('click', startSnake);
// ==================== TIC-TAC-TOE ====================

let tttBoard = Array(9).fill(null);   // 9 empty cells
let tttTurn = 'X';                    // X always starts
let tttActive = true;                 // false once someone wins/draws
let tttWins = Number(localStorage.getItem('hs-tictactoe')) || 0;

const tttCells  = document.querySelectorAll('.ttt-cell');
const tttStatus = document.getElementById('ttt-status');

// All the ways to win: rows, columns, diagonals
const WIN_LINES = [
  [0,1,2], [3,4,5], [6,7,8],   // rows
  [0,3,6], [1,4,7], [2,5,8],   // columns
  [0,4,8], [2,4,6]             // diagonals
];

function resetTTT() {
  tttBoard = Array(9).fill(null);
  tttTurn = 'X';
  tttActive = true;
  tttCells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('win-cell');
  });
  tttStatus.textContent = "PLAYER X'S TURN";
}

function checkWinner() {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
      return line; // return the winning line
    }
  }
  return null;
}

tttCells.forEach(cell => {
  cell.addEventListener('click', () => {
    const index = Number(cell.dataset.index);

    // Ignore click if cell is filled or game is over
    if (tttBoard[index] || !tttActive) return;

    // Place the mark
    tttBoard[index] = tttTurn;
    cell.textContent = tttTurn;

    const winLine = checkWinner();

    if (winLine) {
      tttActive = false;
      tttStatus.textContent = `PLAYER ${tttTurn} WINS!`;
      winLine.forEach(i => tttCells[i].classList.add('win-cell'));

      // Update high score (total wins across both players)
      tttWins++;
      localStorage.setItem('hs-tictactoe', tttWins);
      document.getElementById('hs-tictactoe').textContent = tttWins;

    } else if (tttBoard.every(cell => cell !== null)) {
      tttActive = false;
      tttStatus.textContent = "IT'S A DRAW!";

    } else {
      // Switch turns
      tttTurn = tttTurn === 'X' ? 'O' : 'X';
      tttStatus.textContent = `PLAYER ${tttTurn}'S TURN`;
    }
  });
});


// ==================== MEMORY MATCH ====================

const ICONS = ['👾','🎮','👽','🚀','⭐','💎']; // 6 icons = 12 cards (6 pairs)

const memoryBoardEl = document.getElementById('memory-board');
const memoryStatus  = document.getElementById('memory-status');

let memoryCards   = [];   // the shuffled icons
let flippedCards  = [];   // currently face-up, unmatched cards (max 2)
let matchedCount  = 0;    // how many pairs found
let moveCount     = 0;
let boardLocked   = false; // true while showing a mismatch, ignore clicks
let bestMoves = Number(localStorage.getItem('hs-memory')) || 0;

// Fisher-Yates shuffle: mixes an array into random order
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function resetMemory() {
  // Build 6 pairs, then shuffle them
  memoryCards = shuffle([...ICONS, ...ICONS]);
  flippedCards = [];
  matchedCount = 0;
  moveCount = 0;
  boardLocked = false;
  memoryStatus.textContent = 'MOVES: 0';

  // Clear old cards and build new ones
  memoryBoardEl.innerHTML = '';
  memoryCards.forEach((icon, index) => {
    const cardEl = document.createElement('button');
    cardEl.className = 'memory-card';
    cardEl.dataset.index = index;
    cardEl.dataset.icon = icon;
    cardEl.textContent = '?'; // face-down
    cardEl.addEventListener('click', () => flipCard(cardEl));
    memoryBoardEl.appendChild(cardEl);
  });
}

function flipCard(cardEl) {
  // Ignore clicks while locked, or on already-flipped/matched cards
  if (boardLocked) return;
  if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

  cardEl.textContent = cardEl.dataset.icon;
  cardEl.classList.add('flipped');
  flippedCards.push(cardEl);

  if (flippedCards.length === 2) {
    moveCount++;
    memoryStatus.textContent = `MOVES: ${moveCount}`;
    checkMatch();
  }
}

function checkMatch() {
  const [first, second] = flippedCards;

  if (first.dataset.icon === second.dataset.icon) {
    // Match! Lock them in permanently
    first.classList.add('matched');
    second.classList.add('matched');
    flippedCards = [];
    matchedCount++;

    if (matchedCount === ICONS.length) {
      onMemoryWin();
    }
  } else {
    // No match: lock the board, flip back after a short pause
    boardLocked = true;
    setTimeout(() => {
      first.textContent = '?';
      second.textContent = '?';
      first.classList.remove('flipped');
      second.classList.remove('flipped');
      flippedCards = [];
      boardLocked = false;
    }, 700);
  }
}

function onMemoryWin() {
  memoryStatus.textContent = `SOLVED IN ${moveCount} MOVES!`;

  // Lower is better; save only if it's a new best (or first-ever win)
  if (bestMoves === 0 || moveCount < bestMoves) {
    bestMoves = moveCount;
    localStorage.setItem('hs-memory', bestMoves);
    document.getElementById('hs-memory').textContent = bestMoves;
  }
}// ==================== SNAKE ====================

const snakeCanvas = document.getElementById('snake-canvas');
const ctx         = snakeCanvas.getContext('2d'); // the "pen" we draw with
const snakeStatus  = document.getElementById('snake-status');

const GRID_SIZE  = 20;                          // each cell is 20x20 px
const GRID_COUNT = snakeCanvas.width / GRID_SIZE; // 400/20 = 20 cells across

let snake, direction, nextDirection, food, score, snakeLoopId, gameOver;
let bestScore = Number(localStorage.getItem('hs-snake')) || 0;

function startSnake() {
  // Snake starts as 3 segments in the middle, moving right
  snake = [
    { x: 10, y: 10 },
    { x: 9,  y: 10 },
    { x: 8,  y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameOver = false;
  snakeStatus.textContent = 'SCORE: 0';
  placeFood();

  // Clear any previous loop before starting a new one
  if (snakeLoopId) clearInterval(snakeLoopId);
  snakeLoopId = setInterval(gameTick, 120); // run gameTick every 120ms
}

function stopSnake() {
  if (snakeLoopId) clearInterval(snakeLoopId);
}

function placeFood() {
  // Pick a random cell that isn't currently part of the snake
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_COUNT),
      y: Math.floor(Math.random() * GRID_COUNT)
    };
  } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
  food = newFood;
}

function gameTick() {
  direction = nextDirection;

  // Move the head in the current direction
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Check wall collision
  if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
    return endGame();
  }
  // Check self collision
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return endGame();
  }

  snake.unshift(head); // add new head to the front

  // Did we eat the food?
  if (head.x === food.x && head.y === food.y) {
    score++;
    snakeStatus.textContent = `SCORE: ${score}`;
    placeFood();
    // Don't remove the tail this turn -> snake grows by 1
  } else {
    snake.pop(); // remove the tail -> snake stays the same length
  }

  drawSnake();
}

function drawSnake() {
  // Clear the whole canvas
  ctx.fillStyle = '#0b0221';
  ctx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  // Draw food
  ctx.fillStyle = '#ffe600';
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 10;
  ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);

  // Draw snake
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  snake.forEach(seg => {
    ctx.fillRect(seg.x * GRID_SIZE, seg.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
  });

  ctx.shadowBlur = 0; // reset so glow doesn't leak elsewhere
}

function endGame() {
  gameOver = true;
  stopSnake();
  snakeStatus.textContent = `GAME OVER — SCORE: ${score}`;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('hs-snake', bestScore);
    document.getElementById('hs-snake').textContent = bestScore;
  }
}

// ---------- Keyboard controls ----------
document.addEventListener('keydown', (e) => {
  if (!snakeScreen.classList.contains('active') || gameOver) return;

  const key = e.key.toLowerCase();

  // Prevent reversing directly into yourself (e.g. right -> left)
  if ((key === 'arrowup' || key === 'w') && direction.y === 0) {
    nextDirection = { x: 0, y: -1 };
  } else if ((key === 'arrowdown' || key === 's') && direction.y === 0) {
    nextDirection = { x: 0, y: 1 };
  } else if ((key === 'arrowleft' || key === 'a') && direction.x === 0) {
    nextDirection = { x: -1, y: 0 };
  } else if ((key === 'arrowright' || key === 'd') && direction.x === 0) {
    nextDirection = { x: 1, y: 0 };
  }
});