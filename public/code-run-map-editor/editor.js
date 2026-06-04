/**
 * Code Run map layout editor — exports survival_run_maps.map_data layout fields.
 * Serve via: npm run dev → http://localhost:5173/code-run-map-editor/
 */

const TILE_KINDS = new Set(['ground', 'brick', 'platform', 'block']);
const SOLID_KINDS = ['ground', 'brick', 'platform', 'block'];
const DEFAULT_TILE = 48;
const DISPLAY_TILE = 28;
const ENEMY_W = 38;
const ENEMY_H = 34;

const deriveWorldHeightPx = (gridRows, tileSize) => (
  Math.max(1, Math.floor(gridRows)) * Math.max(1, Math.floor(tileSize))
);

const TOOL_COLORS = {
  ground: '#6b5344',
  brick: '#7a8499',
  platform: '#c9a66b',
  block: '#d4783a',
  spike: '#e74c3c',
  pit: '#1a1020',
  enemy: '#8fd14f',
  spawn: '#4da3ff',
  goal: '#ffd54f',
  eraser: 'transparent',
};

/** @typedef {{ c: number, r: number }} GridPoint */
/** @typedef {{ c0: number, c1: number }} PitRange */
/** @typedef {{ c: number, r: number, id?: string, minX?: number, maxX?: number, speed?: number }} EnemyPlacement */

class CodeRunMapEditor {
  constructor() {
    /** @type {Map<string, string>} */
    this.cells = new Map();
    /** @type {Set<number>} */
    this.pitColumns = new Set();
    /** @type {EnemyPlacement[]} */
    this.enemies = [];
    /** @type {GridPoint | null} */
    this.spawn = { c: 2, r: 9 };
    /** @type {GridPoint | null} */
    this.goal = null;
    this.tool = 'ground';
    this.isPainting = false;
    this.paintErase = false;
    /** @type {EnemyPlacement | null} */
    this.patrolEnemy = null;
    this.patrolStep = 0;
    this.patrolPreviewX = null;
    this.selectedEnemyIndex = -1;

    this.worldTilesWide = 64;
    this.gridRows = 14;
    this.tileSize = DEFAULT_TILE;
    this.groundRow = 9;
    this.manualGround = true;
    this.viewWidth = 960;
    this.viewHeight = 528;
    this.worldHeight = 528;
    this.goalOffsetX = 18;
    this.useGoalColumn = true;
    this.goalColumn = 60;
    this.zoom = 1;

    this.canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('mapCanvas'));
    this.ctx = this.canvas.getContext('2d');
    this.statusEl = document.getElementById('statusText');
    this.patrolBanner = document.getElementById('patrolBanner');
    this.jsonOut = /** @type {HTMLTextAreaElement} */ (document.getElementById('jsonOutput'));

    this.bindUi();
    this.resizeCanvas();
    this.draw();
    this.exportJson();
  }

  bindUi() {
    document.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setTool(btn.getAttribute('data-tool') ?? 'ground');
      });
    });

    const ids = [
      'worldTilesWide', 'gridRows', 'tileSize', 'groundRow', 'viewWidth', 'viewHeight',
      'worldHeight', 'goalOffsetX', 'goalColumn',
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => this.applySettingsFromForm());
      el.addEventListener('input', () => this.applySettingsFromForm());
    });

    const manualGroundEl = document.getElementById('manualGround');
    manualGroundEl?.addEventListener('change', () => {
      this.manualGround = manualGroundEl.checked;
      this.updateGroundToolState();
      this.draw();
      this.exportJson();
    });

    const useGoalColumnEl = document.getElementById('useGoalColumn');
    useGoalColumnEl?.addEventListener('change', () => {
      this.useGoalColumn = useGoalColumnEl.checked;
      this.exportJson();
    });

    document.getElementById('btnExport')?.addEventListener('click', () => this.exportJson());
    document.getElementById('btnCopy')?.addEventListener('click', () => this.copyJson());
    document.getElementById('btnImport')?.addEventListener('click', () => this.importJson());
    document.getElementById('btnClear')?.addEventListener('click', () => {
      if (window.confirm('マップをすべて消去しますか？')) this.clearAll();
    });
    document.getElementById('btnFillGroundRow')?.addEventListener('click', () => this.fillGroundRow());
    document.getElementById('btnCancelPatrol')?.addEventListener('click', () => this.cancelPatrol());

    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    window.addEventListener('mouseup', () => { this.isPainting = false; });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        this.zoom = Math.min(2.5, Math.max(0.5, this.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
        this.resizeCanvas();
        this.draw();
      }
    }, { passive: false });
  }

  cellKey(c, r) {
    return `${c},${r}`;
  }

  getCell(c, r) {
    return this.cells.get(this.cellKey(c, r));
  }

  setCell(c, r, kind) {
    if (c < 0 || r < 0 || c >= this.worldTilesWide || r >= this.gridRows) return;
    const key = this.cellKey(c, r);
    if (kind) this.cells.set(key, kind);
    else this.cells.delete(key);
  }

  applySettingsFromForm() {
    const num = (id, fallback) => {
      const el = document.getElementById(id);
      const v = Number(el?.value);
      return Number.isFinite(v) && v > 0 ? v : fallback;
    };
    this.worldTilesWide = Math.min(400, Math.max(8, Math.floor(num('worldTilesWide', 64))));
    this.gridRows = Math.min(120, Math.max(4, Math.floor(num('gridRows', 14))));
    this.tileSize = Math.min(64, Math.max(16, Math.floor(num('tileSize', DEFAULT_TILE))));
    this.groundRow = Math.min(this.gridRows - 1, Math.max(0, Math.floor(num('groundRow', 9))));
    this.viewWidth = Math.floor(num('viewWidth', 960));
    this.viewHeight = Math.floor(num('viewHeight', 528));
    this.worldHeight = deriveWorldHeightPx(this.gridRows, this.tileSize);
    this.goalOffsetX = num('goalOffsetX', 18);
    this.goalColumn = Math.floor(num('goalColumn', 60));
    this.resizeCanvas();
    this.draw();
    this.exportJson();
  }

  syncSettingsToForm() {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = String(value);
    };
    set('worldTilesWide', this.worldTilesWide);
    set('gridRows', this.gridRows);
    set('tileSize', this.tileSize);
    set('groundRow', this.groundRow);
    set('viewWidth', this.viewWidth);
    set('viewHeight', this.viewHeight);
    set('worldHeight', this.worldHeight);
    set('goalOffsetX', this.goalOffsetX);
    set('goalColumn', this.goalColumn);
    const manualGroundEl = document.getElementById('manualGround');
    if (manualGroundEl) manualGroundEl.checked = this.manualGround;
    const useGoalColumnEl = document.getElementById('useGoalColumn');
    if (useGoalColumnEl) useGoalColumnEl.checked = this.useGoalColumn;
  }

  setTool(tool) {
    if (this.patrolEnemy) this.cancelPatrol();
    this.tool = tool;
    document.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tool') === tool);
    });
    this.updateGroundToolState();
    this.setStatus(`ツール: ${tool}`);
  }

  updateGroundToolState() {
    const groundBtn = document.querySelector('[data-tool="ground"]');
    if (!groundBtn) return;
    const disabled = !this.manualGround;
    groundBtn.toggleAttribute('disabled', disabled);
    groundBtn.style.opacity = disabled ? '0.45' : '1';
  }

  displayTileSize() {
    return Math.round(DISPLAY_TILE * this.zoom);
  }

  resizeCanvas() {
    const ts = this.displayTileSize();
    this.canvas.width = this.worldTilesWide * ts;
    this.canvas.height = this.gridRows * ts;
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
  }

  canvasToGrid(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const ts = this.displayTileSize();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const c = Math.floor(x / ts);
    const r = Math.floor(y / ts);
    const pixelX = (x / ts) * this.tileSize;
    return { c, r, pixelX, pixelY: (y / ts) * this.tileSize };
  }

  onPointerDown(e) {
    const { c, r, pixelX } = this.canvasToGrid(e.clientX, e.clientY);
    if (c < 0 || r < 0 || c >= this.worldTilesWide || r >= this.gridRows) return;

    if (this.tool === 'patrol') {
      this.handlePatrolClick(pixelX, c, r);
      return;
    }

    if (this.tool === 'enemy' && e.button === 0) {
      const hit = this.enemies.findIndex((en) => en.c === c && en.r === r);
      if (hit >= 0) {
        this.startPatrolEdit(hit);
        return;
      }
    }

    if (this.tool === 'enemy' && e.button === 2) {
      this.removeEnemyAt(c, r);
      this.draw();
      this.exportJson();
      return;
    }

    this.isPainting = true;
    this.paintErase = e.button === 2 || this.tool === 'eraser';
    this.applyToolAt(c, r, this.paintErase);
  }

  onPointerMove(e) {
    const { c, r, pixelX } = this.canvasToGrid(e.clientX, e.clientY);
    if (this.patrolEnemy && this.patrolStep === 1) {
      this.patrolPreviewX = pixelX;
      this.draw();
    }
    if (!this.isPainting) {
      this.setStatus(`列 ${c}  行 ${r}`);
      return;
    }
    this.applyToolAt(c, r, this.paintErase);
  }

  applyToolAt(c, r, erase) {
    switch (this.tool) {
      case 'eraser':
        this.setCell(c, r, null);
        break;
      case 'pit':
        if (erase) this.pitColumns.delete(c);
        else this.pitColumns.add(c);
        break;
      case 'spike':
        if (erase) this.setCell(c, r, null);
        else {
          this.setCell(c, r, null);
          this.setCell(c, r, 'spike');
        }
        break;
      case 'spawn':
        if (!erase) this.spawn = { c, r };
        break;
      case 'goal':
        if (!erase) {
          this.goal = { c, r };
          this.useGoalColumn = false;
          const el = document.getElementById('useGoalColumn');
          if (el) el.checked = false;
        }
        break;
      case 'enemy':
        if (!erase) this.placeEnemy(c, r);
        break;
      default:
        if (!TILE_KINDS.has(this.tool)) break;
        if (!this.manualGround && this.tool === 'ground') break;
        if (erase) this.setCell(c, r, null);
        else this.setCell(c, r, this.tool);
        break;
    }
    this.draw();
    this.exportJson();
  }

  placeEnemy(c, r) {
    const existing = this.enemies.findIndex((e) => e.c === c && e.r === r);
    const centerX = c * this.tileSize + (this.tileSize - ENEMY_W) / 2;
    const placement = {
      c,
      r,
      id: `slime-${c}-${r}`,
      minX: Math.max(0, centerX - this.tileSize * 2),
      maxX: Math.min(this.worldTilesWide * this.tileSize - ENEMY_W, centerX + this.tileSize * 2),
      speed: 1.25,
    };
    if (existing >= 0) this.enemies[existing] = placement;
    else this.enemies.push(placement);
    this.selectedEnemyIndex = existing >= 0 ? existing : this.enemies.length - 1;
  }

  removeEnemyAt(c, r) {
    this.enemies = this.enemies.filter((e) => !(e.c === c && e.r === r));
    this.selectedEnemyIndex = -1;
  }

  startPatrolEdit(index) {
    if (index < 0 || index >= this.enemies.length) return;
    this.patrolEnemy = this.enemies[index];
    this.patrolStep = 0;
    this.patrolPreviewX = null;
    this.selectedEnemyIndex = index;
    this.patrolBanner.hidden = false;
    this.setTool('patrol');
    this.setStatus('パトロール: 左端（minX）をクリック');
  }

  handlePatrolClick(pixelX, c, r) {
    const idx = this.enemies.findIndex((e) => e.c === c && e.r === r);
    if (this.patrolEnemy === null && idx >= 0) {
      this.startPatrolEdit(idx);
      return;
    }
    if (!this.patrolEnemy) {
      if (idx >= 0) this.startPatrolEdit(idx);
      else this.setStatus('敵タイルをクリックするか、敵を置いてからパトロールツールを使ってください');
      return;
    }
    const x = Math.round(Math.max(0, Math.min(this.worldTilesWide * this.tileSize - ENEMY_W, pixelX)));
    if (this.patrolStep === 0) {
      this.patrolEnemy.minX = x;
      this.patrolStep = 1;
      this.setStatus('パトロール: 右端（maxX）をクリック');
    } else {
      const minX = this.patrolEnemy.minX ?? x;
      this.patrolEnemy.maxX = x;
      if (x < minX) {
        this.patrolEnemy.minX = x;
        this.patrolEnemy.maxX = minX;
      }
      this.enemies[this.selectedEnemyIndex] = { ...this.patrolEnemy };
      this.cancelPatrol();
      this.exportJson();
    }
    this.draw();
  }

  cancelPatrol() {
    this.patrolEnemy = null;
    this.patrolStep = 0;
    this.patrolPreviewX = null;
    this.patrolBanner.hidden = true;
  }

  fillGroundRow() {
    if (!this.manualGround) {
      window.alert('手動床モードをオンにしてください');
      return;
    }
    for (let c = 0; c < this.worldTilesWide; c += 1) {
      if (!this.pitColumns.has(c)) {
        this.setCell(c, this.groundRow, 'ground');
        this.setCell(c, this.groundRow + 1, 'ground');
      }
    }
    this.draw();
    this.exportJson();
  }

  clearAll() {
    this.cells.clear();
    this.pitColumns.clear();
    this.enemies = [];
    this.spawn = { c: 2, r: this.groundRow };
    this.goal = null;
    this.cancelPatrol();
    this.draw();
    this.exportJson();
  }

  mergePits() {
    const cols = [...this.pitColumns].sort((a, b) => a - b);
    /** @type {PitRange[]} */
    const pits = [];
    let start = null;
    let prev = null;
    for (const c of cols) {
      if (start === null) {
        start = c;
        prev = c;
        continue;
      }
      if (c === prev + 1) {
        prev = c;
        continue;
      }
      pits.push({ c0: start, c1: prev });
      start = c;
      prev = c;
    }
    if (start !== null && prev !== null) pits.push({ c0: start, c1: prev });
    return pits;
  }

  exportSolids() {
    /** @type {Record<string, unknown>[]} */
    const solids = [];
    for (const kind of SOLID_KINDS) {
      for (let r = 0; r < this.gridRows; r += 1) {
        let runStart = null;
        for (let c = 0; c <= this.worldTilesWide; c += 1) {
          const cell = c < this.worldTilesWide ? this.getCell(c, r) : null;
          if (cell === kind) {
            if (runStart === null) runStart = c;
          } else if (runStart !== null) {
            const c0 = runStart;
            const c1 = c - 1;
            if (c0 === c1) solids.push({ kind, c: c0, r });
            else solids.push({ kind, row: r, c0, c1 });
            runStart = null;
          }
        }
      }
    }
    return solids;
  }

  exportSpikes() {
    /** @type {Record<string, unknown>[]} */
    const spikes = [];
    for (let r = 0; r < this.gridRows; r += 1) {
      for (let c = 0; c < this.worldTilesWide; c += 1) {
        if (this.getCell(c, r) === 'spike') spikes.push({ c, row: r });
      }
    }
    return spikes;
  }

  exportEnemies() {
    return this.enemies.map((e) => {
      const row = { c: e.c };
      if (e.r !== undefined && e.r !== this.groundRow) row.r = e.r;
      if (e.id) row.id = e.id;
      if (e.speed !== undefined && e.speed !== 1.25) row.speed = e.speed;
      if (e.minX !== undefined) row.minX = Math.round(e.minX);
      if (e.maxX !== undefined) row.maxX = Math.round(e.maxX);
      return row;
    });
  }

  buildMapJson() {
    const layout = {
      layoutVersion: 1,
      viewWidth: this.viewWidth,
      viewHeight: this.viewHeight,
      tileSize: this.tileSize,
      worldTilesWide: this.worldTilesWide,
      worldTilesHigh: this.gridRows,
      worldHeight: deriveWorldHeightPx(this.gridRows, this.tileSize),
      groundRow: this.groundRow,
      spawn: this.spawn ?? { c: 2, r: this.groundRow },
      pits: this.mergePits(),
      solids: this.exportSolids(),
      spikes: this.exportSpikes(),
      enemies: this.exportEnemies(),
    };
    if (this.manualGround) layout.manualGround = true;
    if (this.useGoalColumn) {
      layout.goalColumn = this.goalColumn;
      layout.goalOffsetX = this.goalOffsetX;
    } else if (this.goal) {
      layout.goal = { c: this.goal.c, r: this.goal.r };
      layout.goalOffsetX = this.goalOffsetX;
    }
    return layout;
  }

  exportJson() {
    const json = this.buildMapJson();
    const text = JSON.stringify(json, null, 2);
    this.jsonOut.value = text;
    return json;
  }

  async copyJson() {
    const text = this.jsonOut.value;
    try {
      await navigator.clipboard.writeText(text);
      this.setStatus('JSON をコピーしました');
    } catch {
      this.jsonOut.select();
      document.execCommand('copy');
      this.setStatus('JSON を選択しました（手動でコピー）');
    }
  }

  importJson() {
    const raw = this.jsonOut.value.trim();
    if (!raw) return;
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      window.alert('JSON の解析に失敗しました');
      return;
    }
    const source = data.layout && typeof data.layout === 'object' ? data.layout : data;
    this.clearAll();
    this.worldTilesWide = positiveInt(source.worldTilesWide, 64);
    this.gridRows = positiveInt(source.worldTilesHigh, Math.ceil(positiveInt(source.worldHeight, 528) / positiveInt(source.tileSize, DEFAULT_TILE)));
    this.tileSize = positiveInt(source.tileSize, DEFAULT_TILE);
    this.groundRow = nonNegInt(source.groundRow, 9);
    this.viewWidth = positiveInt(source.viewWidth, 960);
    this.viewHeight = positiveInt(source.viewHeight, 528);
    this.worldHeight = deriveWorldHeightPx(this.gridRows, this.tileSize);
    this.goalOffsetX = nonNegNumber(source.goalOffsetX, 18);
    this.manualGround = source.manualGround === true;
    this.useGoalColumn = !source.goal;
    this.goalColumn = nonNegInt(source.goalColumn, 60);
    if (source.spawn) this.spawn = { c: source.spawn.c, r: source.spawn.r };
    if (source.goal) {
      this.goal = { c: source.goal.c, r: source.goal.r };
      this.useGoalColumn = false;
    }

    const pits = Array.isArray(source.pits) ? source.pits : [];
    for (const pit of pits) {
      if (typeof pit.c0 !== 'number' || typeof pit.c1 !== 'number') continue;
      for (let c = pit.c0; c <= pit.c1; c += 1) this.pitColumns.add(c);
    }

    const solids = Array.isArray(source.solids) ? source.solids : [];
    for (const s of solids) this.applySolidPlacement(s);

    const spikes = Array.isArray(source.spikes) ? source.spikes : [];
    for (const sp of spikes) {
      if (typeof sp.c !== 'number') continue;
      this.setCell(sp.c, typeof sp.row === 'number' ? sp.row : this.groundRow, 'spike');
    }

    const enemies = Array.isArray(source.enemies) ? source.enemies : [];
    this.enemies = enemies
      .filter((e) => typeof e.c === 'number')
      .map((e) => ({
        c: e.c,
        r: typeof e.r === 'number' ? e.r : this.groundRow,
        id: typeof e.id === 'string' ? e.id : `slime-${e.c}-${e.r ?? this.groundRow}`,
        minX: typeof e.minX === 'number' ? e.minX : undefined,
        maxX: typeof e.maxX === 'number' ? e.maxX : undefined,
        speed: typeof e.speed === 'number' ? e.speed : 1.25,
      }));

    if (!this.manualGround) this.applyAutoGroundPreview();

    this.syncSettingsToForm();
    this.updateGroundToolState();
    this.resizeCanvas();
    this.draw();
    this.setStatus('JSON を読み込みました');
  }

  applySolidPlacement(s) {
    if (!TILE_KINDS.has(s.kind)) return;
    if (typeof s.c === 'number' && typeof s.r === 'number') {
      this.setCell(s.c, s.r, s.kind);
      return;
    }
    if (typeof s.row === 'number' && typeof s.c0 === 'number' && typeof s.c1 === 'number') {
      for (let c = s.c0; c <= s.c1; c += 1) this.setCell(c, s.row, s.kind);
      return;
    }
    if (typeof s.col === 'number' && typeof s.r0 === 'number' && typeof s.r1 === 'number') {
      for (let r = s.r0; r <= s.r1; r += 1) this.setCell(s.col, r, s.kind);
    }
  }

  applyAutoGroundPreview() {
    for (let c = 0; c < this.worldTilesWide; c += 1) {
      if (this.pitColumns.has(c)) continue;
      this.setCell(c, this.groundRow, 'ground');
      if (this.groundRow + 1 < this.gridRows) this.setCell(c, this.groundRow + 1, 'ground');
    }
  }

  draw() {
    const ctx = this.ctx;
    const ts = this.displayTileSize();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < this.gridRows; r += 1) {
      for (let c = 0; c < this.worldTilesWide; c += 1) {
        const x = c * ts;
        const y = r * ts;
        ctx.fillStyle = (c + r) % 2 === 0 ? '#1e2430' : '#1a1f28';
        ctx.fillRect(x, y, ts, ts);
        if (this.pitColumns.has(c) && r >= this.groundRow) {
          ctx.fillStyle = 'rgba(80, 40, 120, 0.35)';
          ctx.fillRect(x, y, ts, ts);
        }
      }
    }

    for (const [key, kind] of this.cells) {
      if (!TILE_KINDS.has(kind) && kind !== 'spike') continue;
      const [cs, rs] = key.split(',');
      const c = Number(cs);
      const r = Number(rs);
      this.drawTile(c, r, kind, ts);
    }

    if (!this.manualGround) {
      ctx.strokeStyle = 'rgba(90, 180, 255, 0.5)';
      ctx.setLineDash([4, 4]);
      const y = this.groundRow * ts;
      ctx.strokeRect(0, y, this.canvas.width, ts * 2);
      ctx.setLineDash([]);
    }

    for (let i = 0; i < this.enemies.length; i += 1) {
      this.drawEnemy(this.enemies[i], i === this.selectedEnemyIndex, ts);
    }

    if (this.spawn) this.drawMarker(this.spawn.c, this.spawn.r, 'S', '#4da3ff', ts);
    if (this.goal && !this.useGoalColumn) this.drawMarker(this.goal.c, this.goal.r, 'G', '#ffd54f', ts);
    if (this.useGoalColumn && this.goalColumn >= 0 && this.goalColumn < this.worldTilesWide) {
      this.drawMarker(this.goalColumn, this.groundRow, 'G', '#ffd54f', ts);
    }

    if (this.patrolEnemy && this.patrolPreviewX !== null && this.patrolStep === 1) {
      const minX = this.patrolEnemy.minX ?? 0;
      const maxX = this.patrolPreviewX;
      const row = this.patrolEnemy.r ?? this.groundRow;
      const y = row * ts - ts * 0.35;
      ctx.strokeStyle = '#ffe566';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((minX / this.tileSize) * ts, y);
      ctx.lineTo((maxX / this.tileSize) * ts, y);
      ctx.stroke();
    }
  }

  drawTile(c, r, kind, ts) {
    const ctx = this.ctx;
    const x = c * ts;
    const y = r * ts;
    const pad = Math.max(1, Math.floor(ts * 0.08));
    if (kind === 'platform') {
      ctx.fillStyle = TOOL_COLORS.platform;
      ctx.fillRect(x + pad, y + ts * 0.55, ts - pad * 2, ts * 0.2);
      ctx.strokeStyle = '#8a6d3b';
      ctx.strokeRect(x + pad, y + ts * 0.55, ts - pad * 2, ts * 0.2);
      return;
    }
    if (kind === 'spike') {
      ctx.fillStyle = TOOL_COLORS.spike;
      ctx.beginPath();
      ctx.moveTo(x + ts * 0.5, y + ts * 0.85);
      ctx.lineTo(x + ts * 0.15, y + ts * 0.35);
      ctx.lineTo(x + ts * 0.85, y + ts * 0.35);
      ctx.closePath();
      ctx.fill();
      return;
    }
    ctx.fillStyle = TOOL_COLORS[kind] ?? '#888';
    ctx.fillRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2);
    if (kind === 'block') {
      ctx.strokeStyle = '#8a4a20';
      ctx.strokeRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2);
    }
  }

  drawEnemy(enemy, selected, ts) {
    const ctx = this.ctx;
    const r = enemy.r ?? this.groundRow;
    const x = enemy.c * ts + (ts - (ENEMY_W / this.tileSize) * ts) / 2;
    const y = r * ts - (ENEMY_H / this.tileSize) * ts;
    const w = (ENEMY_W / this.tileSize) * ts;
    const h = (ENEMY_H / this.tileSize) * ts;
    ctx.fillStyle = selected ? '#b8ff7a' : TOOL_COLORS.enemy;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2d5016';
    ctx.stroke();

    const minX = enemy.minX ?? 0;
    const maxX = enemy.maxX ?? this.worldTilesWide * this.tileSize;
    const lineY = r * ts - 4;
    ctx.strokeStyle = 'rgba(255, 220, 80, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((minX / this.tileSize) * ts, lineY);
    ctx.lineTo((maxX / this.tileSize) * ts, lineY);
    ctx.stroke();
    ctx.fillStyle = '#ffe566';
    ctx.fillRect((minX / this.tileSize) * ts - 3, lineY - 3, 6, 6);
    ctx.fillRect((maxX / this.tileSize) * ts - 3, lineY - 3, 6, 6);
  }

  drawMarker(c, r, label, color, ts) {
    const ctx = this.ctx;
    const x = c * ts;
    const y = r * ts;
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
    ctx.fillStyle = '#111';
    ctx.font = `bold ${Math.floor(ts * 0.45)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + ts / 2, y + ts / 2);
  }

  setStatus(msg) {
    if (this.statusEl) this.statusEl.textContent = msg;
  }
}

function positiveInt(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

function nonNegInt(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
}

function nonNegNumber(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;
}

window.addEventListener('DOMContentLoaded', () => {
  const editor = new CodeRunMapEditor();
  window.codeRunMapEditor = editor;
});
