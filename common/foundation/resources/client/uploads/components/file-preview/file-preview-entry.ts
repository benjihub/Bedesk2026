export interface FilePreviewEntry {
  id: number;
  name: string;
  file_name: string;
  file_size?: number;
  mime: string;
  extension?: string;
  type: string;
  url: string;
  hash: string;
}
