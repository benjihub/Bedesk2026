export interface FileInputConfig {
  types?: (FileInputType | string)[];
  extensions?: string[];
  multiple?: boolean;
  directory?: boolean;
}

export enum FileInputType {
  image = 'image/*',
  audio = 'audio/*',
  text = 'text/*',
  json = 'application/json',
  video = 'video/mp4,video/mpeg,video/x-m4v,video/*',
}
