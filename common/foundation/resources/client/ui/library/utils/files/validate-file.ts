import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {prettyBytes} from '@ui/utils/files/pretty-bytes';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import match from 'mime-match';

export interface Restrictions {
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export function validateFile(
  file: UploadedFile,
  restrictions?: Restrictions | null,
): MessageDescriptor | void {
  if (!restrictions) return;

  const {maxFileSize, allowedFileTypes} = restrictions;

  if (maxFileSize && file.size != null && file.size > maxFileSize) {
    return message('`:file` exceeds maximum allowed size of :size', {
      values: {file: file.name, size: prettyBytes(maxFileSize)},
    });
  }

  if (allowedFileTypes?.length) {
    if (!fileMatchesTypes(file, allowedFileTypes)) {
      return message('This file type is not allowed');
    }
  }
}

function fileMatchesTypes(file: UploadedFile, types: string[]): boolean {
  return (
    types
      // support multiple file types in a string (video/mp4,audio/mp3,image/png)
      .map(type => type.split(','))
      .flat()
      .some(type => {
        // check if this is a mime-type
        if (type.includes('/')) {
          if (!file.mime) return false;
          return match(file.mime.replace(/;.*?$/, ''), type);
        }

        // otherwise this is likely an extension
        const extension = type.replace('.', '').toLowerCase();
        if (extension && file.extension) {
          return file.extension.toLowerCase() === extension;
        }
        return false;
      })
  );
}
