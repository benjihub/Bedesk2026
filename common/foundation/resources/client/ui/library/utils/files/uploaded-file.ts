import {getFileMime} from '@ui/utils/files/get-file-mime';
import {extensionFromFilename} from '@ui/utils/files/extension-from-filename';
import {nanoid} from 'nanoid';
import {FileEntry} from '@common/uploads/file-entry';

export class UploadedFile {
  id: string;
  fingerprint: string;
  name: string;
  relativePath = '';
  size: number;
  mime = '';
  extension = '';
  native: File;
  lastModified: number;

  private cachedData?: string;
  get data(): Promise<string> {
    return new Promise(resolve => {
      if (this.cachedData) {
        resolve(this.cachedData);
      }
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        this.cachedData = reader.result as string;
        resolve(this.cachedData);
      });

      if (this.extension === 'json') {
        reader.readAsText(this.native);
      } else {
        reader.readAsDataURL(this.native);
      }
    });
  }

  constructor(file: File, relativePath?: string | null) {
    this.id = nanoid();
    this.name = file.name;
    this.size = file.size;
    this.mime = getFileMime(file);
    this.lastModified = file.lastModified;
    this.extension = extensionFromFilename(file.name) || 'bin';
    this.native = file;
    relativePath = relativePath || file.webkitRelativePath || '';

    // remove leading slashes
    relativePath = relativePath.replace(/^\/+/g, '');

    // only include relative path if file is actually in a folder and not just /file.txt
    if (relativePath && relativePath.split('/').length > 1) {
      this.relativePath = relativePath;
    }

    this.fingerprint = generateFingerprint({
      name: this.name,
      size: this.size,
      mime: this.mime,
      lastModified: this.lastModified,
    });
  }
}

export class UploadedFileFromEntry {
  id: string;
  fingerprint: string;
  name: string;
  relativePath = '';
  size: number;
  mime = '';
  extension = '';
  native = null;
  lastModified: string;

  get data(): Promise<string> {
    return new Promise((resolve, reject) => {
      reject('UploadedFileFromEntry does not have file data');
    });
  }

  constructor(entry: FileEntry) {
    this.id = nanoid();
    this.name = entry.name;
    this.size = entry.file_size ?? 0;
    this.mime = entry.mime;
    this.lastModified = entry.updated_at || '';
    this.extension = entry.extension || 'bin';
    this.relativePath = entry.path;

    this.fingerprint = generateFingerprint({
      name: this.name,
      size: this.size,
      mime: this.mime,
      lastModified: this.lastModified,
    });
  }
}

interface FileMeta {
  name?: string;
  mime?: string | null;
  size?: number | string;
  lastModified?: number | string;
  relativePath?: string;
}
function generateFingerprint({
  name,
  mime,
  size,
  relativePath,
  lastModified,
}: FileMeta) {
  let id = 'be';
  if (typeof name === 'string') {
    id += `-${encodeFilename(name.toLowerCase())}`;
  }

  if (mime) {
    id += `-${mime}`;
  }

  if (typeof relativePath === 'string') {
    id += `-${encodeFilename(relativePath.toLowerCase())}`;
  }

  if (size !== undefined) {
    id += `-${size}`;
  }
  if (lastModified !== undefined) {
    id += `-${lastModified}`;
  }

  return id;
}

function encodeCharacter(character: string) {
  return character.charCodeAt(0).toString(32);
}

function encodeFilename(name: string) {
  let suffix = '';
  return (
    name.replace(/[^A-Z0-9]/gi, character => {
      suffix += `-${encodeCharacter(character)}`;
      return '/';
    }) + suffix
  );
}
