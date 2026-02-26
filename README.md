# onecv

One CV — a client-side static web app for managing a portable CV container file (`.ocv`).

## What is OneCV?

OneCV lets you maintain your CV as a single self-contained `.ocv` file — a ZIP archive with a defined structure — entirely in your browser. No server, no cloud sync.

### OCV v1 container structure

```
my-cv.ocv  (ZIP)
├── manifest.json      ← metadata + file index (SHA-256 hashes)
├── cv.json            ← core CV data
└── attachments/
    └── <sha256-hex>   ← raw attachment bytes (filename = sha256 hash)
```

## Features

- **Create** a new `.ocv` workspace in-browser
- **Open/import** an existing `.ocv` file from disk
- **Edit** core CV fields (personal info, experience, education, skills)
- **Manage attachments** (add, remove, list with hash verification)
- **Export/download** an updated `.ocv` file
- **Auto-saves** to IndexedDB — your work survives page reloads

## Getting started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Development

```bash
cd app
npm install
npm run dev
```

The app is available at `http://localhost:5173`.

### Production build

```bash
cd app
npm run build
# output in app/dist/
```

Preview the production build:

```bash
cd app
npm run preview
```

## Example file

An example minimal `.ocv` file is provided in [`examples/minimal.ocv`](examples/minimal.ocv).
It was generated according to the OCV v1 spec and contains a sample CV for "Alice Smith" plus one text attachment.

## Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the app to GitHub Pages on every push to `main`.

Enable GitHub Pages in the repository settings:
1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**
