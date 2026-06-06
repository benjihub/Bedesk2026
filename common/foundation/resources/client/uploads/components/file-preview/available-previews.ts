import {AudioFilePreview} from './file-preview/audio-file-preview';
import {DefaultFilePreview} from './file-preview/default-file-preview';
import {ImageFilePreview} from './file-preview/image-file-preview';
import {PdfFilePreview} from './file-preview/pdf-file-preview';
import {TextFilePreview} from './file-preview/text-file-preview';
import {VideoFilePreview} from './file-preview/video-file-preview';
import {WordDocumentFilePreview} from './file-preview/word-document-file-preview';

export const AvailablePreviews = {
  text: TextFilePreview,
  video: VideoFilePreview,
  audio: AudioFilePreview,
  image: ImageFilePreview,
  pdf: PdfFilePreview,
  spreadsheet: WordDocumentFilePreview,
  powerPoint: WordDocumentFilePreview,
  word: WordDocumentFilePreview,
  'text/rtf': DefaultFilePreview,
} as const;

export function getPreviewForEntry(entry: {mime?: string; type?: string}) {
  const mime = entry?.mime as keyof typeof AvailablePreviews;
  const type = entry?.type as keyof typeof AvailablePreviews;
  return (
    AvailablePreviews[mime] || AvailablePreviews[type] || DefaultFilePreview
  );
}
