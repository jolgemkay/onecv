import './style.css';
import { renderWelcome, renderWorkspace } from './ui.js';
import { openOcv, exportOcv, createEmptyWorkspace, addAttachment, removeAttachment } from './ocv.js';
import { saveWorkspace, loadWorkspace, clearWorkspace } from './storage.js';
import type { OcvWorkspace } from './types.js';

// ── DOM scaffold ────────────────────────────────────────────────────────────
const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.innerHTML = `
  <header>
    <h1>OneCV</h1>
  </header>
  <main id="main-content"></main>
  <div id="toast"></div>
`;

const mainContent = document.querySelector<HTMLDivElement>('#main-content')!;
const toastEl = document.querySelector<HTMLDivElement>('#toast')!;
const headerEl = document.querySelector<HTMLElement>('header')!;

// ── Header button helpers ────────────────────────────────────────────────────
function setHeaderButtons(html: string) {
  headerEl.querySelectorAll('.header-btn').forEach(b => b.remove());
  if (html) headerEl.insertAdjacentHTML('beforeend', html);
}

// ── Toast helper ─────────────────────────────────────────────────────────────
let toastTimer: ReturnType<typeof setTimeout> | null = null;
function showToast(msg: string) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

// ── State ────────────────────────────────────────────────────────────────────
let current: OcvWorkspace | null = null;
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    if (!current) return;
    try {
      await saveWorkspace(current);
      showToast('Auto-saved.');
    } catch {
      showToast('Auto-save failed.');
    }
  }, 1200);
}

// ── Show welcome screen ───────────────────────────────────────────────────────
function showWelcome() {
  current = null;
  setHeaderButtons('');
  renderWelcome(mainContent, handleNew, handleOpen);
}

// ── Show editor ──────────────────────────────────────────────────────────────
function showEditor(ws: OcvWorkspace, startCollapsed = false) {
  current = ws;
  renderWorkspace(
    mainContent,
    ws,
    handleDelete,
    handleAddAttachment,
    handleRemoveAttachment,
    scheduleAutoSave,
    startCollapsed,
  );
  setHeaderButtons(`
    <button id="btn-header-save" class="header-btn" title="Save">
      <span class="material-symbols-outlined">save</span>
    </button>
    <button id="btn-header-export" class="header-btn" title="Download .ocv">
      <span class="material-symbols-outlined">download</span>
    </button>
  `);
  headerEl.querySelector('#btn-header-save')!.addEventListener('click', handleSave);
  headerEl.querySelector('#btn-header-export')!.addEventListener('click', handleExport);
}

// ── Handlers ─────────────────────────────────────────────────────────────────
function handleNew() {
  showEditor(createEmptyWorkspace());
  showToast('New CV created.');
}

async function handleOpen(file: File) {
  try {
    const buf = await file.arrayBuffer();
    const ws = await openOcv(buf);
    showEditor(ws, true);
    showToast(`Opened "${file.name}"`);
  } catch (err) {
    alert(`Could not open file: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleSave() {
  if (!current) return;
  try {
    await saveWorkspace(current);
    showToast('Saved.');
  } catch (err) {
    alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleExport() {
  if (!current) return;
  try {
    const blob = await exportOcv(current);
    const name = (current.cv.name.trim() || 'cv').replace(/\s+/g, '_') + '.ocv';
    downloadBlob(blob, name);
    showToast(`Exported "${name}"`);
  } catch (err) {
    alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleDelete() {
  if (current) {
    if (!confirm('Delete this CV? It will be removed from browser storage.')) return;
    await clearWorkspace();
  }
  showWelcome();
}

async function handleAddAttachment(file: File) {
  if (!current) return;
  await addAttachment(current, file);
}

function handleRemoveAttachment(hash: string) {
  if (!current) return;
  removeAttachment(current, hash);
}

// ── Download helper ──────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ── Init: restore saved workspace or show welcome ────────────────────────────
async function init() {
  try {
    const saved = await loadWorkspace();
    if (saved) {
      showEditor(saved);
      showToast('CV restored from browser storage.');
    } else {
      showWelcome();
    }
  } catch {
    showWelcome();
  }
}

init();
