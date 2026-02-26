import type { OcvWorkspace, Experience, Education, Course, Certificate } from './types.js';

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

    <details open class="card" id="section-cv">
      <summary class="card-summary"><h2>CV — Personal Info</h2></summary>
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
    </details>

    <details open class="card" id="section-experience">
      <summary class="card-summary"><h2>Experience</h2></summary>
      <div id="experience-list" class="entry-list"></div>
      <button id="btn-add-exp" class="btn-secondary btn-sm">+ Add Experience</button>
    </details>

    <details open class="card" id="section-education">
      <summary class="card-summary"><h2>Education</h2></summary>
      <div id="education-list" class="entry-list"></div>
      <button id="btn-add-edu" class="btn-secondary btn-sm">+ Add Education</button>
    </details>

    <details open class="card" id="section-courses">
      <summary class="card-summary"><h2>Courses</h2></summary>
      <div id="courses-list" class="entry-list"></div>
      <button id="btn-add-course" class="btn-secondary btn-sm">+ Add Course</button>
    </details>

    <details open class="card" id="section-certificates">
      <summary class="card-summary"><h2>Certificates</h2></summary>
      <div id="certificates-list" class="entry-list"></div>
      <button id="btn-add-cert" class="btn-secondary btn-sm">+ Add Certificate</button>
    </details>

    <details open class="card" id="section-skills">
      <summary class="card-summary"><h2>Skills</h2></summary>
      <div id="skills-tags" class="tags"></div>
      <div class="field" style="display:flex;gap:.5rem;align-items:center">
        <input type="text" id="skill-input" placeholder="Add a skill…" style="flex:1" />
        <button id="btn-add-skill" class="btn-secondary btn-sm">Add</button>
      </div>
    </details>

    <details open class="card" id="section-attachments">
      <summary class="card-summary"><h2>Attachments</h2></summary>
      <ul id="attachment-list" class="attachment-list"></ul>
      <div>
        <input type="file" id="attachment-file" style="display:none" multiple />
        <button id="btn-add-attachment" class="btn-secondary btn-sm">+ Add File</button>
      </div>
    </details>
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
      const card = document.createElement('details');
      card.className = 'entry-card';
      card.open = true;
      const label = (exp.title || exp.company)
        ? `${exp.title || '(untitled)'}${exp.company ? ' @ ' + exp.company : ''}`
        : `Experience ${i + 1}`;
      card.innerHTML = `
        <summary class="entry-summary">
          <span>${escapeHtml(label)}</span>
          <button class="btn-danger btn-sm remove-entry" data-index="${i}" title="Remove">✕</button>
        </summary>
        <div class="form-grid form-grid-2" style="gap:.6rem;padding:.85rem">
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

      card.querySelector('.remove-entry')!.addEventListener('click', (e) => {
        e.stopPropagation();
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
      const card = document.createElement('details');
      card.className = 'entry-card';
      card.open = true;
      const label = (edu.degree || edu.institution)
        ? `${edu.degree || '(no degree)'}${edu.institution ? ' @ ' + edu.institution : ''}`
        : `Education ${i + 1}`;
      card.innerHTML = `
        <summary class="entry-summary">
          <span>${escapeHtml(label)}</span>
          <button class="btn-danger btn-sm remove-entry" data-index="${i}" title="Remove">✕</button>
        </summary>
        <div class="form-grid form-grid-2" style="gap:.6rem;padding:.85rem">
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

      card.querySelector('.remove-entry')!.addEventListener('click', (e) => {
        e.stopPropagation();
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

  // ── Courses ────────────────────────────────────────────────────────────
  cv.courses = cv.courses ?? [];
  const coursesList = container.querySelector('#courses-list') as HTMLDivElement;
  function renderCourses() {
    coursesList.innerHTML = '';
    cv.courses.forEach((course, i) => {
      const card = document.createElement('details');
      card.className = 'entry-card';
      card.open = true;
      const label = course.title
        ? `${course.title}${course.provider ? ' — ' + course.provider : ''}`
        : `Course ${i + 1}`;
      card.innerHTML = `
        <summary class="entry-summary">
          <span>${escapeHtml(label)}</span>
          <button class="btn-danger btn-sm remove-entry" data-index="${i}" title="Remove">✕</button>
        </summary>
        <div class="form-grid form-grid-2" style="gap:.6rem;padding:.85rem">
          <div class="field"><label>Title</label><input type="text" data-key="title" value="" /></div>
          <div class="field"><label>Provider</label><input type="text" data-key="provider" value="" /></div>
          <div class="field"><label>Date</label><input type="date" data-key="date" value="" /></div>
          <div class="field"><label>URL</label><input type="url" data-key="url" value="" placeholder="https://…" /></div>
        </div>`;
      coursesList.appendChild(card);

      card.querySelectorAll<HTMLInputElement>('[data-key]').forEach(el => {
        const key = el.dataset.key as keyof Course;
        el.value = String(course[key] ?? '');
        el.addEventListener('input', () => {
          cv.courses[i][key as keyof Course] = el.value as never;
        });
      });

      card.querySelector('.remove-entry')!.addEventListener('click', (e) => {
        e.stopPropagation();
        cv.courses.splice(i, 1);
        renderCourses();
      });
    });
  }
  renderCourses();

  container.querySelector('#btn-add-course')!.addEventListener('click', () => {
    cv.courses.push({ title: '', provider: '', date: '', url: '' });
    renderCourses();
  });

  // ── Certificates ───────────────────────────────────────────────────────
  cv.certificates = cv.certificates ?? [];
  const certsList = container.querySelector('#certificates-list') as HTMLDivElement;
  function renderCertificates() {
    certsList.innerHTML = '';
    cv.certificates.forEach((cert, i) => {
      const card = document.createElement('details');
      card.className = 'entry-card';
      card.open = true;
      const label = cert.title
        ? `${cert.title}${cert.issuer ? ' — ' + cert.issuer : ''}`
        : `Certificate ${i + 1}`;
      card.innerHTML = `
        <summary class="entry-summary">
          <span>${escapeHtml(label)}</span>
          <button class="btn-danger btn-sm remove-entry" data-index="${i}" title="Remove">✕</button>
        </summary>
        <div class="form-grid form-grid-2" style="gap:.6rem;padding:.85rem">
          <div class="field"><label>Title</label><input type="text" data-key="title" value="" /></div>
          <div class="field"><label>Issuer</label><input type="text" data-key="issuer" value="" /></div>
          <div class="field"><label>Date</label><input type="date" data-key="date" value="" /></div>
          <div class="field"><label>URL</label><input type="url" data-key="url" value="" placeholder="https://…" /></div>
        </div>`;
      certsList.appendChild(card);

      card.querySelectorAll<HTMLInputElement>('[data-key]').forEach(el => {
        const key = el.dataset.key as keyof Certificate;
        el.value = String(cert[key] ?? '');
        el.addEventListener('input', () => {
          cv.certificates[i][key as keyof Certificate] = el.value as never;
        });
      });

      card.querySelector('.remove-entry')!.addEventListener('click', (e) => {
        e.stopPropagation();
        cv.certificates.splice(i, 1);
        renderCertificates();
      });
    });
  }
  renderCertificates();

  container.querySelector('#btn-add-cert')!.addEventListener('click', () => {
    cv.certificates.push({ title: '', issuer: '', date: '', url: '' });
    renderCertificates();
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

      const nameBtn = document.createElement('button');
      nameBtn.className = 'attachment-name';
      nameBtn.title = `View ${f.originalName}`;
      nameBtn.textContent = f.originalName;
      nameBtn.addEventListener('click', () => {
        const data = workspace.attachmentData.get(f.hash);
        if (!data) return;
        const blob = new Blob([data.buffer as ArrayBuffer], { type: f.mime });
        const url = URL.createObjectURL(blob);
        if (f.mime === 'application/pdf') {
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        } else if (f.mime.startsWith('image/')) {
          showImageModal(url, f.originalName);
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = f.originalName;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 10_000);
        }
      });

      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = `${f.mime} · ${formatBytes(f.size)}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-danger';
      removeBtn.setAttribute('data-hash', f.hash);
      removeBtn.title = 'Remove';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => {
        onRemoveAttachment(f.hash);
        renderAttachments();
      });

      li.appendChild(nameBtn);
      li.appendChild(meta);
      li.appendChild(removeBtn);
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

// ── Image modal ───────────────────────────────────────────────────────────────

function showImageModal(url: string, name: string) {
  const overlay = document.createElement('div');
  overlay.className = 'img-overlay';

  const inner = document.createElement('div');
  inner.className = 'img-overlay-inner';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'img-overlay-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';

  const img = document.createElement('img');
  img.src = url;
  img.alt = name;

  inner.appendChild(closeBtn);
  inner.appendChild(img);
  overlay.appendChild(inner);
  document.body.appendChild(overlay);

  function close() {
    document.body.removeChild(overlay);
    URL.revokeObjectURL(url);
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
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
