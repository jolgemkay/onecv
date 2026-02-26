import type { OcvWorkspace, Experience, Education } from './types.js';

/**
 * Render the full workspace editing UI into #main-content.
 */
export function renderWorkspace(
  container: HTMLElement,
  workspace: OcvWorkspace,
  onSave: () => void,
  onExport: () => void,
  onClose: () => void,
  onAddAttachment: (file: File) => Promise<void>,
  onRemoveAttachment: (hash: string) => void,
): void {
  container.innerHTML = `
    <div id="toolbar" class="card">
      <button id="btn-save" class="btn-primary btn-sm">💾 Save</button>
      <button id="btn-export" class="btn-secondary btn-sm">⬇ Export .ocv</button>
      <button id="btn-close" class="btn-secondary btn-sm">✕ Close</button>
    </div>

    <div class="card" id="section-cv">
      <h2>CV — Personal Info</h2>
      <div class="form-grid form-grid-2">
        <div class="field">
          <label for="cv-name">Full Name</label>
          <input type="text" id="cv-name" placeholder="Alice Smith" />
        </div>
        <div class="field">
          <label for="cv-email">Email</label>
          <input type="email" id="cv-email" placeholder="alice@example.com" />
        </div>
        <div class="field">
          <label for="cv-phone">Phone</label>
          <input type="tel" id="cv-phone" placeholder="+1 555 0100" />
        </div>
        <div class="field">
          <label for="cv-location">Location</label>
          <input type="text" id="cv-location" placeholder="City, Country" />
        </div>
      </div>
      <div class="field" style="margin-top:.75rem">
        <label for="cv-summary">Summary</label>
        <textarea id="cv-summary" placeholder="Brief professional summary…"></textarea>
      </div>
    </div>

    <div class="card" id="section-experience">
      <h2>Experience</h2>
      <div id="experience-list" class="entry-list"></div>
      <button id="btn-add-exp" class="btn-secondary btn-sm">+ Add Experience</button>
    </div>

    <div class="card" id="section-education">
      <h2>Education</h2>
      <div id="education-list" class="entry-list"></div>
      <button id="btn-add-edu" class="btn-secondary btn-sm">+ Add Education</button>
    </div>

    <div class="card" id="section-skills">
      <h2>Skills</h2>
      <div id="skills-tags" class="tags"></div>
      <div class="field" style="display:flex;gap:.5rem;align-items:center">
        <input type="text" id="skill-input" placeholder="Add a skill…" style="flex:1" />
        <button id="btn-add-skill" class="btn-secondary btn-sm">Add</button>
      </div>
    </div>

    <div class="card" id="section-attachments">
      <h2>Attachments</h2>
      <ul id="attachment-list" class="attachment-list"></ul>
      <div>
        <input type="file" id="attachment-file" style="display:none" multiple />
        <button id="btn-add-attachment" class="btn-secondary btn-sm">+ Add File</button>
      </div>
    </div>
  `;

  // ── Populate fields ──────────────────────────────────────────────────────
  const cv = workspace.cv;
  (container.querySelector('#cv-name') as HTMLInputElement).value = cv.name;
  (container.querySelector('#cv-email') as HTMLInputElement).value = cv.email;
  (container.querySelector('#cv-phone') as HTMLInputElement).value = cv.phone;
  (container.querySelector('#cv-location') as HTMLInputElement).value = cv.location;
  (container.querySelector('#cv-summary') as HTMLTextAreaElement).value = cv.summary;

  // ── Sync CV fields back to workspace on change ───────────────────────────
  function bindInput(id: string, key: 'name' | 'email' | 'phone' | 'location' | 'summary') {
    const el = container.querySelector(id) as HTMLInputElement | HTMLTextAreaElement;
    el.addEventListener('input', () => {
      cv[key] = el.value;
    });
  }
  bindInput('#cv-name', 'name');
  bindInput('#cv-email', 'email');
  bindInput('#cv-phone', 'phone');
  bindInput('#cv-location', 'location');
  bindInput('#cv-summary', 'summary');

  // ── Experience ─────────────────────────────────────────────────────────
  const expList = container.querySelector('#experience-list') as HTMLDivElement;
  function renderExperience() {
    expList.innerHTML = '';
    cv.experience.forEach((exp, i) => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `
        <button class="btn-danger btn-sm remove-entry" data-index="${i}" title="Remove">✕</button>
        <div class="form-grid form-grid-2" style="gap:.6rem">
          <div class="field"><label>Title</label><input type="text" data-exp="${i}" data-key="title" value="" /></div>
          <div class="field"><label>Company</label><input type="text" data-exp="${i}" data-key="company" value="" /></div>
          <div class="field"><label>From</label><input type="date" data-exp="${i}" data-key="from" value="" /></div>
          <div class="field"><label>To</label><input type="date" data-exp="${i}" data-key="to" value="" /></div>
          <div class="field" style="grid-column:1/-1">
            <label>Description</label>
            <textarea data-exp="${i}" data-key="description"></textarea>
          </div>
        </div>`;
      expList.appendChild(card);

      // set values after inserting so special chars are safe
      card.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-key]').forEach(el => {
        const key = el.dataset.key as keyof Experience;
        el.value = String(exp[key] ?? '');
        el.addEventListener('input', () => {
          cv.experience[i][key as keyof Experience] = el.value as never;
        });
      });

      card.querySelector('.remove-entry')!.addEventListener('click', () => {
        cv.experience.splice(i, 1);
        renderExperience();
      });
    });
  }
  renderExperience();

  container.querySelector('#btn-add-exp')!.addEventListener('click', () => {
    cv.experience.push({ title: '', company: '', from: '', to: '', description: '' });
    renderExperience();
  });

  // ── Education ──────────────────────────────────────────────────────────
  const eduList = container.querySelector('#education-list') as HTMLDivElement;
  function renderEducation() {
    eduList.innerHTML = '';
    cv.education.forEach((edu, i) => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `
        <button class="btn-danger btn-sm remove-entry" data-index="${i}" title="Remove">✕</button>
        <div class="form-grid form-grid-2" style="gap:.6rem">
          <div class="field"><label>Degree</label><input type="text" data-edu="${i}" data-key="degree" value="" /></div>
          <div class="field"><label>Institution</label><input type="text" data-edu="${i}" data-key="institution" value="" /></div>
          <div class="field"><label>From</label><input type="date" data-edu="${i}" data-key="from" value="" /></div>
          <div class="field"><label>To</label><input type="date" data-edu="${i}" data-key="to" value="" /></div>
        </div>`;
      eduList.appendChild(card);

      card.querySelectorAll<HTMLInputElement>('[data-key]').forEach(el => {
        const key = el.dataset.key as keyof Education;
        el.value = String(edu[key] ?? '');
        el.addEventListener('input', () => {
          cv.education[i][key as keyof Education] = el.value as never;
        });
      });

      card.querySelector('.remove-entry')!.addEventListener('click', () => {
        cv.education.splice(i, 1);
        renderEducation();
      });
    });
  }
  renderEducation();

  container.querySelector('#btn-add-edu')!.addEventListener('click', () => {
    cv.education.push({ degree: '', institution: '', from: '', to: '' });
    renderEducation();
  });

  // ── Skills ────────────────────────────────────────────────────────────
  const skillsTags = container.querySelector('#skills-tags') as HTMLDivElement;
  function renderSkills() {
    skillsTags.innerHTML = '';
    cv.skills.forEach((skill, i) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.innerHTML = `${escapeHtml(skill)} <button aria-label="Remove ${escapeHtml(skill)}">✕</button>`;
      tag.querySelector('button')!.addEventListener('click', () => {
        cv.skills.splice(i, 1);
        renderSkills();
      });
      skillsTags.appendChild(tag);
    });
  }
  renderSkills();

  const skillInput = container.querySelector('#skill-input') as HTMLInputElement;
  function addSkill() {
    const val = skillInput.value.trim();
    if (val && !cv.skills.includes(val)) {
      cv.skills.push(val);
      skillInput.value = '';
      renderSkills();
    }
  }
  container.querySelector('#btn-add-skill')!.addEventListener('click', addSkill);
  skillInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } });

  // ── Attachments ────────────────────────────────────────────────────────
  function renderAttachments() {
    const ul = container.querySelector('#attachment-list') as HTMLUListElement;
    ul.innerHTML = '';
    if (workspace.manifest.files.length === 0) {
      const li = document.createElement('li');
      li.style.color = 'var(--color-muted)';
      li.style.fontSize = '.85rem';
      li.textContent = 'No attachments.';
      ul.appendChild(li);
      return;
    }
    workspace.manifest.files.forEach(f => {
      const li = document.createElement('li');
      li.className = 'attachment-item';
      li.innerHTML = `
        <span class="name">${escapeHtml(f.originalName)}</span>
        <span class="meta">${escapeHtml(f.mime)} · ${formatBytes(f.size)}</span>
        <button class="btn-danger" data-hash="${escapeHtml(f.hash)}" title="Remove">✕</button>`;
      li.querySelector('button')!.addEventListener('click', () => {
        onRemoveAttachment(f.hash);
        renderAttachments();
      });
      ul.appendChild(li);
    });
  }
  renderAttachments();

  const fileInput = container.querySelector('#attachment-file') as HTMLInputElement;
  container.querySelector('#btn-add-attachment')!.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files ?? []);
    for (const f of files) {
      await onAddAttachment(f);
    }
    fileInput.value = '';
    renderAttachments();
  });

  // ── Toolbar buttons ────────────────────────────────────────────────────
  container.querySelector('#btn-save')!.addEventListener('click', onSave);
  container.querySelector('#btn-export')!.addEventListener('click', onExport);
  container.querySelector('#btn-close')!.addEventListener('click', onClose);
}

/** Render the welcome / landing screen. */
export function renderWelcome(
  container: HTMLElement,
  onNew: () => void,
  onOpen: (file: File) => void,
): void {
  container.innerHTML = `
    <div class="card" id="welcome">
      <h2>Welcome to OneCV</h2>
      <p>Manage your CV as a portable, self-contained <code>.ocv</code> file — everything stays in your browser.</p>
      <div class="btn-row">
        <button id="btn-new" class="btn-primary">✨ New workspace</button>
        <button id="btn-open" class="btn-secondary">📂 Open .ocv file</button>
      </div>
      <input type="file" id="open-file-input" accept=".ocv" style="display:none" />
    </div>`;

  container.querySelector('#btn-new')!.addEventListener('click', onNew);

  const openInput = container.querySelector('#open-file-input') as HTMLInputElement;
  container.querySelector('#btn-open')!.addEventListener('click', () => openInput.click());
  openInput.addEventListener('change', () => {
    const file = openInput.files?.[0];
    if (file) onOpen(file);
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBytes(n: number): string {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}
