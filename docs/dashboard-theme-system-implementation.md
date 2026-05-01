# JARVIS Dashboard Theme System Umsetzung

Diese Datei beschreibt die erste technische Umsetzung für drei Dashboard Themes.

Zielseite im aktuellen Repository:

```text
frontend/public/jarvis-global-overview-standalone.html
```

Hinweis: Der ursprünglich genannte Pfad `docs/index.html` ist im aktuellen Stand nicht vorhanden. Der GitHub Pages Launcher liegt im Root als `index.html`, das eigentliche Weltkarten Dashboard liegt unter `frontend/public/`.

## Reihenfolge

```text
1. Theme Switcher Grundsystem
2. MATRIX Theme
3. ULTRON Theme
4. Performance und Accessibility Prüfung
5. Integration in die große Single File HTML
```

## Theme Klassen

```text
body.theme-jarvis
body.theme-matrix
body.theme-ultron
```

## Theme Speicher

```text
localStorage key: jarvis.dashboard.theme
values: jarvis, matrix, ultron
```

## Theme Switcher HTML

```html
<div class="theme-switcher" role="group" aria-label="Dashboard Theme">
  <button type="button" data-theme="jarvis">JARVIS</button>
  <button type="button" data-theme="matrix">MATRIX</button>
  <button type="button" data-theme="ultron">ULTRON</button>
</div>
```

## JavaScript Grundsystem

```js
const themeKey = 'jarvis.dashboard.theme';
const allowedThemes = new Set(['jarvis', 'matrix', 'ultron']);
const themeParams = {
  jarvis: {
    mapDot: 'rgba(0,212,255,.66)',
    route: 'rgba(0,212,255,.82)',
    packet: '#ffffff',
    threat: '#ff3344',
    hub: '#00d4ff',
    motion: 'smooth'
  },
  matrix: {
    mapDot: 'rgba(0,255,65,.62)',
    route: 'rgba(0,255,65,.78)',
    packet: '#d8ffe2',
    threat: '#a8ffb8',
    hub: '#ffffff',
    motion: 'data-stream'
  },
  ultron: {
    mapDot: 'rgba(139,10,26,.72)',
    route: 'rgba(255,31,61,.82)',
    packet: '#ff5e3a',
    threat: '#ff1f3d',
    hub: '#ff1f3d',
    motion: 'mechanical'
  }
};

function getStoredTheme() {
  const stored = localStorage.getItem(themeKey);
  return allowedThemes.has(stored) ? stored : 'jarvis';
}

function setTheme(nextTheme) {
  const theme = allowedThemes.has(nextTheme) ? nextTheme : 'jarvis';
  document.body.classList.remove('theme-jarvis', 'theme-matrix', 'theme-ultron');
  document.body.classList.add(`theme-${theme}`);
  document.body.dataset.theme = theme;
  localStorage.setItem(themeKey, theme);
  window.jarvisTheme = themeParams[theme];
  replayThemeBoot(theme);
  updateThemeButtons(theme);
}

function updateThemeButtons(theme) {
  document.querySelectorAll('[data-theme]').forEach((button) => {
    const active = button.dataset.theme === theme;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function replayThemeBoot(theme) {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.remove('theme-switching');
  void app.offsetWidth;
  app.classList.add('theme-switching');
  window.setTimeout(() => app.classList.remove('theme-switching'), 900);
}

function initThemeSwitcher() {
  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.addEventListener('click', () => setTheme(button.dataset.theme));
  });
  setTheme(getStoredTheme());
}
```

## Gemeinsamer CSS Zusatz

```css
.theme-switcher{
  pointer-events:auto;
  display:flex;
  gap:6px;
  justify-content:center;
  margin-top:10px;
}
.theme-switcher button{
  border:1px solid var(--line);
  background:rgba(0,14,28,.55);
  color:var(--muted);
  font:inherit;
  font-size:10px;
  letter-spacing:.12em;
  padding:6px 9px;
  cursor:pointer;
}
.theme-switcher button.active,
.theme-switcher button:focus-visible{
  color:var(--white);
  outline:2px solid var(--cyan);
  outline-offset:2px;
  box-shadow:0 0 18px rgba(0,212,255,.28);
}
.theme-switching .boot-flash{
  animation:themeFlash .9s ease-out 1;
}
@keyframes themeFlash{
  0%{opacity:0}
  16%{opacity:.34}
  100%{opacity:0}
}
@media (prefers-reduced-motion: reduce){
  *,*:before,*:after{
    animation-duration:20s!important;
    transition-duration:.01ms!important;
  }
}
```

## MATRIX Konzept Umsetzung

Mood:

```text
hypnotisch
monochrom
terminalartig
kalt
informationell
```

### MATRIX CSS Override

```css
body.theme-matrix{
  --bg0:#000000;
  --bg1:#000000;
  --cyan:#00ff41;
  --blue:#008f11;
  --white:#ffffff;
  --red:#00ff41;
  --green:#00ff41;
  --panel:rgba(0,20,0,.85);
  --line:rgba(0,255,65,.25);
  --muted:rgba(0,255,65,.5);
  color:#b8ffc8;
  font-family:'Courier Prime','Courier New',monospace;
}
body.theme-matrix #app{
  background:#000000;
}
body.theme-matrix #app:before{
  opacity:.18;
  background-image:linear-gradient(rgba(0,255,65,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,65,.04) 1px,transparent 1px);
}
body.theme-matrix #app:after{
  background:repeating-linear-gradient(180deg,rgba(0,255,65,.06) 0 1px,transparent 1px 4px);
  opacity:.18;
}
body.theme-matrix .panel,
body.theme-matrix .bottom-card{
  background:rgba(0,20,0,.85);
  border-color:rgba(0,255,65,.25);
  box-shadow:inset 0 0 16px rgba(0,255,65,.06);
}
body.theme-matrix .panel:before{
  background:linear-gradient(#00ff41,transparent,#00ff41);
}
body.theme-matrix .title h1,
body.theme-matrix .bottom-card strong,
body.theme-matrix .panel h3{
  color:#d8ffe2;
  text-shadow:0 0 10px rgba(0,255,65,.9),0 0 28px rgba(0,255,65,.45);
  text-transform:uppercase;
}
body.theme-matrix .title h1{
  animation:matrixHeadline 11s linear infinite;
}
body.theme-matrix .route{
  stroke:rgba(0,255,65,.78);
  stroke-width:1.5;
  filter:drop-shadow(0 0 7px rgba(0,255,65,.9));
}
body.theme-matrix .route.glow{
  stroke:rgba(0,255,65,.12);
  stroke-width:8;
}
body.theme-matrix .route.red,
body.theme-matrix .packet.red,
body.theme-matrix .map-dot.red{
  stroke:#a8ffb8;
  fill:#a8ffb8;
}
body.theme-matrix .hub-core{
  background:radial-gradient(circle,#fff 0 18%,#00ff41 38%,rgba(0,143,17,.35) 58%,transparent 76%);
  box-shadow:0 0 22px #fff,0 0 66px #00ff41,0 0 110px rgba(0,255,65,.55);
}
body.theme-matrix .hub-ring.r2{
  border-color:rgba(255,255,255,.72);
}
body.theme-matrix .view-btn,
body.theme-matrix .theme-switcher button{
  border-color:rgba(0,255,65,.35);
  color:#00ff41;
  background:rgba(0,20,0,.55);
}
body.theme-matrix .theme-switcher button.active,
body.theme-matrix .theme-switcher button:hover{
  color:#ffffff;
  box-shadow:0 0 18px rgba(0,255,65,.36);
}
@keyframes matrixHeadline{
  0%,96%,100%{transform:translate(0,0);filter:brightness(1)}
  97%{transform:translate(1px,-1px);filter:brightness(1.5)}
  98%{transform:translate(-2px,1px);filter:brightness(.8)}
  99%{transform:translate(0,0);filter:brightness(1.25)}
}
```

### MATRIX Code Rain Layer

```html
<canvas id="matrixRain" class="matrix-rain" aria-hidden="true"></canvas>
```

```css
.matrix-rain{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  z-index:1;
  pointer-events:none;
  opacity:0;
}
body.theme-matrix .matrix-rain{
  opacity:.72;
}
```

```js
function createMatrixRain(canvas) {
  const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ctx = canvas.getContext('2d');
  let columns = [];
  let width = 0;
  let height = 0;
  let glyphSize = 18;

  function resize() {
    width = canvas.width = canvas.clientWidth * devicePixelRatio;
    height = canvas.height = canvas.clientHeight * devicePixelRatio;
    glyphSize = (innerWidth < 900 ? 14 : 18) * devicePixelRatio;
    const count = Math.floor(width / glyphSize);
    columns = Array.from({ length: count }, () => Math.random() * height / glyphSize);
  }

  function draw() {
    if (!document.body.classList.contains('theme-matrix')) {
      requestAnimationFrame(draw);
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    ctx.fillRect(0,0,width,height);
    ctx.font = `${glyphSize}px Courier New`;
    columns.forEach((y, i) => {
      const text = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = i * glyphSize;
      ctx.save();
      if (Math.random() > .5) {
        ctx.translate(x + glyphSize, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = Math.random() > .88 ? '#ffffff' : '#00ff41';
        ctx.fillText(text, 0, y * glyphSize);
      } else {
        ctx.fillStyle = Math.random() > .88 ? '#ffffff' : '#00ff41';
        ctx.fillText(text, x, y * glyphSize);
      }
      ctx.restore();
      columns[i] = y * glyphSize > height && Math.random() > .975 ? 0 : y + .55 + Math.random() * .75;
    });
    requestAnimationFrame(draw);
  }

  addEventListener('resize', resize);
  resize();
  draw();
}
```

## ULTRON Vorbereitungsnotiz

ULTRON bekommt im nächsten Schritt den eigenen CSS Override, Circuit Layer und mechanische Canvas Parameter. MATRIX wird zuerst integriert und geprüft, danach folgt ULTRON.
