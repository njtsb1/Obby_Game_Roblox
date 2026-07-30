const LANGS = {
  "en-US": {
    start: "Start",
    restart: "Restart",
    instructions: "Use ↑ and ↓ (or W/S) to move vertically. Use ← and → (or D/A) to move forward/back. Press Space to rotate. Press F to shoot. Obstacles kill on touch. Reach the finish line to score.",
    score: "Score",
    saved: "Saved",
    lost: "Lost",
    gameOver: "Game Over",
    playAgain: "Play Again",
    ready: "Ready"
  },
  "pt-BR": {
    start: "Iniciar",
    restart: "Reiniciar",
    instructions: "Use ↑ e ↓ (ou W/S) para mover verticalmente. Use ← e → (or D/A) para frente/atrás. Pressione Espaço para girar. Pressione F para atirar. Obstáculos matam ao encostar. Alcance a linha de chegada para pontuar.",
    score: "Pontos",
    saved: "Salvos",
    lost: "Perdidos",
    gameOver: "Fim de Jogo",
    playAgain: "Jogar Novamente",
    ready: "Pronto"
  },
  "es-ES": {
    start: "Iniciar",
    restart: "Reiniciar",
    instructions: "Usa ↑ y ↓ (o W/S) para mover verticalmente. Usa ← y → (or D/A) para adelante/atrás. Pulsa Espacio para girar. Pulsa F para disparar. Los obstáculos matan al tocar. Llega a la meta para puntuar.",
    score: "Puntos",
    saved: "Rescatados",
    lost: "Perdidos",
    gameOver: "Juego Terminado",
    playAgain: "Jugar Otra Vez",
    ready: "Listo"
  }
};

const DEFAULT_LANG = "en-US";
let lang = DEFAULT_LANG;

// DOM refs
const gameArea = document.getElementById("gameArea");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreEl = document.getElementById("score");
const savedEl = document.getElementById("saved");
const lostEl = document.getElementById("lost");
const statusEl = document.getElementById("status");
const instructionsEl = document.getElementById("instructions");
const langSelect = document.getElementById("langSelect");
const themeToggle = document.getElementById("themeToggle");

// UI setup
function applyLanguage(code) {
  lang = LANGS[code] ? code : DEFAULT_LANG;
  const t = LANGS[lang];
  startBtn.textContent = t.start;
  restartBtn.textContent = t.restart;
  instructionsEl.textContent = t.instructions;
  document.getElementById("labelScore").textContent = t.score;
  document.getElementById("labelSaved").textContent = t.saved;
  document.getElementById("labelLost").textContent = t.lost;
  statusEl.textContent = t.ready;
  document.documentElement.lang = lang;
  document.body.setAttribute("data-lang", lang);
}
langSelect.value = DEFAULT_LANG;
applyLanguage(DEFAULT_LANG);
langSelect.addEventListener("change", (e) => applyLanguage(e.target.value));

// Theme toggle
function setTheme(isLight) {
  document.body.classList.toggle("light", isLight);
  document.body.classList.toggle("dark", !isLight);
}
themeToggle.addEventListener("click", () => {
  const isLight = !document.body.classList.contains("light");
  setTheme(isLight);
});

// Game class
class Game {
  constructor(area) {
    this.area = area;
    this.W = area.clientWidth;
    this.H = area.clientHeight;
    this.player = null;
    this.obstacles = [];
    this.projectiles = [];
    this.finish = null;
    this.running = false;
    this.keys = {};
    this.score = 0;
    this.saved = 0;
    this.lost = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1200;
    this.lastTime = 0;
    this.obstacleSpeed = 2.2;
    this.finishCooldown = 0;
    this._canShoot = false;
    this._canRotate = true; // rotation cooldown gate
    this.rotationAngle = 0; // current rotation angle of player
    this.init();
  }

  init() {
    this.area.innerHTML = "";
    // finish line
    const finish = document.createElement("div");
    finish.className = "finish";
    this.area.appendChild(finish);
    this.finish = finish;

    // player
    const p = document.createElement("div");
    p.className = "player";
    p.style.left = "40px";
    p.style.top = `${(this.H - 48) / 2}px`;
    p.textContent = "YOU";
    p.dataset.rot = "0";
    this.area.appendChild(p);
    this.player = p;

    // focus for keyboard
    this.area.tabIndex = 0;
    this.area.focus();

    // keyboard
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    // create a few static platforms (floating platforms) as part of the obby
    this._createPlatforms();

    this.updateHUD();
  }

  _createPlatforms() {
    // Platforms are obstacles with special class 'platform' (safe to stand on)
    const platforms = [
      { left: 220, top: 420, w: 140, h: 18, class: "shape-rect" },
      { left: 420, top: 320, w: 110, h: 18, class: "shape-rect" },
      { left: 640, top: 220, w: 110, h: 18, class: "shape-rect" },
      { left: 300, top: 140, w: 56, h: 56, class: "shape-square" }
    ];
    platforms.forEach(p => {
      const el = document.createElement("div");
      el.className = `obstacle ${p.class} platform`;
      el.style.left = `${p.left}px`;
      el.style.top = `${p.top}px`;
      if (p.w) el.style.width = `${p.w}px`;
      if (p.h) el.style.height = `${p.h}px`;
      el.dataset.safe = "1";
      this.area.appendChild(el);
    });
  }

  _onKeyDown = (e) => {
    const key = e.key.toLowerCase();
    // prevent default for arrow keys and space to keep focus in game area
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key) || e.code === "Space") {
      e.preventDefault();
    }
    this.keys[key] = true;
  };

  _onKeyUp = (e) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
    statusEl.textContent = LANGS[lang].ready;
  }

  stop() {
    this.running = false;
  }

  restart() {
    this.stop();
    this.obstacles.forEach(o => o.el.remove());
    this.projectiles.forEach(p => p.el.remove());
    this.obstacles = [];
    this.projectiles = [];
    this.score = 0;
    this.saved = 0;
    this.lost = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1200;
    this.obstacleSpeed = 2.2;
    this.finishCooldown = 0;
    this._canShoot = false;
    this._canRotate = true;
    this.rotationAngle = 0;
    this.init();
    this.start();
  }

  loop = (now) => {
    if (!this.running) return;
    const dt = now - this.lastTime;
    this.lastTime = now;

    this.handleInput(dt);
    this.updateEntities(dt);
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
      this.obstacleSpeed += 0.06;
      if (this.spawnInterval > 500) this.spawnInterval -= 8;
    }
    this.checkCollisions();
    this.updateHUD();

    requestAnimationFrame(this.loop);
  };

  handleInput(dt) {
    const step = 6;
    const leftStep = 6;
    const top = parseFloat(this.player.style.top);
    const left = parseFloat(this.player.style.left);

    // vertical movement
    if (this.keys["arrowup"] || this.keys["w"]) {
      this.player.style.top = `${Math.max(0, top - step)}px`;
    }
    if (this.keys["arrowdown"] || this.keys["s"]) {
      this.player.style.top = `${Math.min(this.H - this.player.offsetHeight, top + step)}px`;
    }

    // horizontal movement (forward/back)
    if (this.keys["arrowright"] || this.keys["d"] || this.keys["right"]) {
      // move right but keep inside area
      const nx = Math.min(this.W - this.player.offsetWidth - 8, left + leftStep);
      this.player.style.left = `${nx}px`;
    }
    if (this.keys["arrowleft"] || this.keys["a"] || this.keys["left"]) {
      const nx = Math.max(0, left - leftStep);
      this.player.style.left = `${nx}px`;
    }

    // shoot
    if (this.keys["f"]) {
      if (!this._canShoot) {
        this._canShoot = true;
        this.shoot();
        setTimeout(() => (this._canShoot = false), 300);
      }
    }

    // rotate on Space (use code check to be robust)
    if ((this.keys[" "] || this.keys["space"]) && this._canRotate) {
      this._canRotate = false;
      this.rotatePlayer();
      // small cooldown to avoid repeated rotations while holding space
      setTimeout(() => (this._canRotate = true), 300);
    }
  }

  rotatePlayer() {
    // rotate 90 degrees clockwise each press
    this.rotationAngle = (this.rotationAngle + 90) % 360;
    this.player.style.transform = `translateY(-50%) rotate(${this.rotationAngle}deg)`;
    this.player.dataset.rot = String(this.rotationAngle);
  }

  spawnObstacle() {
    // choose random shape
    const shapes = ["shape-square", "shape-rect", "shape-diamond", "shape-triangle"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const tpl = document.getElementById("obstacleTpl");
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.classList.add(shape);

    // random vertical position
    const h = (node.classList.contains("shape-rect")) ? 36 : 56;
    const y = Math.floor(Math.random() * (this.H - h));
    node.style.left = `${this.W}px`;
    node.style.top = `${y}px`;

    // add dynamic behavior metadata
    const behavior = Math.random();
    const rotate = behavior > 0.7; // rotating obstacles
    const oscillate = behavior > 0.4 && behavior <= 0.7; // vertical oscillation
    const horizontal = behavior <= 0.2; // horizontal moving platform (acts like a moving barrier)
    const speed = this.obstacleSpeed + Math.random() * 1.2;

    // attach custom properties
    node.dataset.rotate = rotate ? "1" : "0";
    node.dataset.osc = oscillate ? "1" : "0";
    node.dataset.horiz = horizontal ? "1" : "0";
    node.dataset.ang = "0";
    node.dataset.baseY = y;
    node.dataset.speed = speed;

    // give different sizes for variety
    if (shape === "shape-rect") {
      node.style.width = `${90 + Math.floor(Math.random() * 60)}px`;
      node.style.height = `36px`;
    } else if (shape === "shape-square") {
      const s = 36 + Math.floor(Math.random() * 36);
      node.style.width = `${s}px`;
      node.style.height = `${s}px`;
    } else if (shape === "shape-diamond") {
      const s = 48 + Math.floor(Math.random() * 24);
      node.style.width = `${s}px`;
      node.style.height = `${s}px`;
      node.style.transform = `rotate(45deg)`;
    }

    this.area.appendChild(node);
    this.obstacles.push({ el: node, speed, horiz: horizontal });
  }

  shoot() {
    const tpl = document.getElementById("projectileTpl");
    const node = tpl.content.firstElementChild.cloneNode(true);
    const px = parseFloat(this.player.style.left) + this.player.offsetWidth + 6;
    const py = parseFloat(this.player.style.top) + this.player.offsetHeight / 2 - 4;
    node.style.left = `${px}px`;
    node.style.top = `${py}px`;
    this.area.appendChild(node);
    this.projectiles.push({ el: node, speed: 8 });
  }

  updateEntities(dt) {
    // obstacles movement
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      const el = o.el;
      let left = parseFloat(el.style.left);
      // horizontal moving obstacles (back-and-forth)
      if (el.dataset.horiz === "1") {
        if (!el.dataset.dir) el.dataset.dir = "-1";
        let dir = parseFloat(el.dataset.dir);
        left += dir * (o.speed * 0.8);
        if (left < 120) { left = 120; el.dataset.dir = "1"; }
        if (left + el.offsetWidth > this.W - 120) { left = this.W - 120 - el.offsetWidth; el.dataset.dir = "-1"; }
        el.style.left = `${left}px`;
      } else {
        left -= o.speed;
        el.style.left = `${left}px`;
      }

      // rotate
      if (el.dataset.rotate === "1") {
        let ang = parseFloat(el.dataset.ang) || 0;
        ang = (ang + 4) % 360;
        el.dataset.ang = ang;
        el.style.transform = `rotate(${ang}deg)`;
      }

      // oscillate
      if (el.dataset.osc === "1") {
        const baseY = parseFloat(el.dataset.baseY);
        const t = performance.now() / 300;
        const ny = baseY + Math.sin(t + i) * 30;
        el.style.top = `${ny}px`;
      }

      if (left + el.offsetWidth < 0) {
        el.remove();
        this.obstacles.splice(i, 1);
      }
    }

    // projectiles movement
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const left = parseFloat(p.el.style.left);
      p.el.style.left = `${left + p.speed}px`;
      if (left > this.W) {
        p.el.remove();
        this.projectiles.splice(i, 1);
      }
    }

    // finish crossing
    const playerRect = this.player.getBoundingClientRect();
    const finishRect = this.finish.getBoundingClientRect();
    const areaRect = this.area.getBoundingClientRect();
    const playerX = playerRect.left - areaRect.left;
    const finishX = finishRect.left - areaRect.left;
    if (playerX + this.player.offsetWidth >= finishX && this.finishCooldown <= 0) {
      this.score += 10;
      this.saved += 1;
      this.finishCooldown = 900;
      // reset player vertical position
      this.player.style.top = `${(this.H - this.player.offsetHeight) / 2}px`;
      this.flashPanel();
    }
    if (this.finishCooldown > 0) this.finishCooldown -= 16;
  }

  checkCollisions() {
    const playerRect = this.player.getBoundingClientRect();

    // player vs obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      const oRect = o.el.getBoundingClientRect();
      if (this._rectsOverlap(playerRect, oRect)) {
        // if obstacle is marked safe (platform), ignore collision
        if (o.el.dataset.safe === "1") continue;
        // kill player
        this.lost += 1;
        this.gameOver();
        return;
      }
    }

    // projectile vs obstacle
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const pRect = p.el.getBoundingClientRect();
      for (let j = this.obstacles.length - 1; j >= 0; j--) {
        const o = this.obstacles[j];
        const oRect = o.el.getBoundingClientRect();
        if (this._rectsOverlap(pRect, oRect)) {
          // destroy both
          o.el.remove();
          this.obstacles.splice(j, 1);
          p.el.remove();
          this.projectiles.splice(i, 1);
          this.score += 5;
          return;
        }
      }
    }
  }

  _rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  updateHUD() {
    scoreEl.textContent = this.score;
    savedEl.textContent = this.saved;
    lostEl.textContent = this.lost;
  }

  flashPanel() {
    const el = document.querySelector(".panel");
    if (!el) return;
    el.animate([{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }], { duration: 260 });
  }

  gameOver() {
    this.stop();
    // remove listeners to avoid duplicates
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `<div class="box"><h2>${LANGS[lang].gameOver}</h2>
      <p>${LANGS[lang].score}: ${this.score}</p>
      <button id="playAgainBtn" class="primary">${LANGS[lang].playAgain}</button>
    </div>`;
    this.area.appendChild(overlay);
    document.getElementById("playAgainBtn").addEventListener("click", () => {
      overlay.remove();
      this.restart();
    });
  }
}

// wiring UI
let game = new Game(gameArea);

startBtn.addEventListener("click", () => {
  if (!game) game = new Game(gameArea);
  game.start();
});

restartBtn.addEventListener("click", () => {
  if (!game) game = new Game(gameArea);
  game.restart();
});

// ensure default theme and language
setTheme(false);
applyLanguage(DEFAULT_LANG);
