/**
 * OCV v1 container specification types.
 *
 * Container structure (ZIP):
 *   manifest.json  – top-level metadata + file index
 *   cv.json        – core CV data
 *   attachments/   – hashed files (sha256 hex, no extension)
 */

export interface ManifestFile {
  hash: string;        // SHA-256 hex of file content
  originalName: string;
  mime: string;
  size: number;
}

export interface Manifest {
  version: 1;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  files: ManifestFile[];
}

export interface Course {
  title: string;
  provider: string;
  date: string;
  url: string;
}

export interface Certificate {
  title: string;
  issuer: string;
  date: string;
  url: string;
}

export interface CvJson {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  courses: Course[];
  certificates: Certificate[];
}

export interface Experience {
  title: string;
  company: string;
  from: string;
  to: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  from: string;
  to: string;
}

/**
 * In-memory representation of an open OCV workspace.
 */
export interface OcvWorkspace {
  manifest: Manifest;
  cv: CvJson;
  /** Map from hash → raw file bytes */
  attachmentData: Map<string, Uint8Array>;
}
