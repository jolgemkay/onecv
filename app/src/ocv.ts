import JSZip from 'jszip';
import type { Manifest, CvJson, OcvWorkspace } from './types.js';
import { sha256Hex } from './crypto.js';

const MANIFEST_PATH = 'manifest.json';
const CV_PATH = 'cv.json';
const ATTACHMENTS_DIR = 'attachments/';

/** Read an .ocv file (ZIP) and return a workspace object. */
export async function openOcv(data: ArrayBuffer): Promise<OcvWorkspace> {
  const zip = await JSZip.loadAsync(data);

  const manifestFile = zip.file(MANIFEST_PATH);
  if (!manifestFile) throw new Error('Invalid .ocv: missing manifest.json');
  const manifest: Manifest = JSON.parse(await manifestFile.async('string'));
  if (manifest.version !== 1) throw new Error('Unsupported OCV version: ' + manifest.version);

  const cvFile = zip.file(CV_PATH);
  if (!cvFile) throw new Error('Invalid .ocv: missing cv.json');
  const cv: CvJson = JSON.parse(await cvFile.async('string'));

  const attachmentData = new Map<string, Uint8Array>();
  for (const entry of manifest.files) {
    const f = zip.file(ATTACHMENTS_DIR + entry.hash);
    if (f) {
      attachmentData.set(entry.hash, await f.async('uint8array'));
    }
  }

  return { manifest, cv, attachmentData };
}

/** Serialise a workspace back to .ocv bytes. */
export async function exportOcv(workspace: OcvWorkspace): Promise<Blob> {
  const zip = new JSZip();

  const now = new Date().toISOString();
  const manifest: Manifest = {
    ...workspace.manifest,
    updatedAt: now,
  };

  zip.file(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  zip.file(CV_PATH, JSON.stringify(workspace.cv, null, 2));

  for (const [hash, bytes] of workspace.attachmentData) {
    zip.file(ATTACHMENTS_DIR + hash, bytes);
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/** Create a brand-new empty workspace. */
export function createEmptyWorkspace(): OcvWorkspace {
  const now = new Date().toISOString();
  return {
    manifest: {
      version: 1,
      createdAt: now,
      updatedAt: now,
      files: [],
    },
    cv: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      experience: [],
      education: [],
      skills: [],
      courses: [],
      certificates: [],
    },
    attachmentData: new Map(),
  };
}

/** Add a file attachment to a workspace, updating the manifest. */
export async function addAttachment(
  workspace: OcvWorkspace,
  file: File,
): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = await sha256Hex(bytes);

  // Avoid duplicate hashes
  if (!workspace.attachmentData.has(hash)) {
    workspace.attachmentData.set(hash, bytes);
    workspace.manifest.files.push({
      hash,
      originalName: file.name,
      mime: file.type || 'application/octet-stream',
      size: bytes.length,
    });
  }

  return hash;
}

/** Remove an attachment by hash. */
export function removeAttachment(workspace: OcvWorkspace, hash: string): void {
  workspace.attachmentData.delete(hash);
  workspace.manifest.files = workspace.manifest.files.filter(f => f.hash !== hash);
}
