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

// ── Show welcome screen ───────────────────────────────────────────────────────
function showWelcome() {
  current = null;
  renderWelcome(mainContent, handleNew, handleOpen);
}

// ── Show editor ──────────────────────────────────────────────────────────────
function showEditor(ws: OcvWorkspace) {
  current = ws;
  renderWorkspace(
    mainContent,
    ws,
    handleSave,
    handleExport,
    handleClose,
    handleAddAttachment,
    handleRemoveAttachment,
  );
}

// ── Handlers ─────────────────────────────────────────────────────────────────
function handleNew() {
  showEditor(createEmptyWorkspace());
  showToast('New workspace created.');
}

async function handleOpen(file: File) {
  try {
    const buf = await file.arrayBuffer();
    const ws = await openOcv(buf);
    showEditor(ws);
    showToast(`Opened "${file.name}"`);
  } catch (err) {
    alert(`Could not open file: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleSave() {
  if (!current) return;
  try {
    await saveWorkspace(current);
    showToast('Saved to browser storage.');
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

async function handleClose() {
  if (current) {
    if (!confirm('Close workspace? Unsaved changes will be lost.')) return;
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
      showToast('Restored workspace from browser storage.');
    } else {
      showWelcome();
    }
  } catch {
    showWelcome();
  }
}

init();
