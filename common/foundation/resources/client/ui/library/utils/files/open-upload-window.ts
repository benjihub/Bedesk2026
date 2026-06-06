import {createUploadInput} from '@ui/utils/files/create-upload-input';
import {FileInputConfig} from '@ui/utils/files/file-input-config';
import {UploadedFile} from '@ui/utils/files/uploaded-file';

/**
 * Open browser dialog for uploading files and
 * resolve promise with uploaded files.
 */
export function openUploadWindow(
  config: FileInputConfig = {},
): Promise<UploadedFile[]> {
  return new Promise(resolve => {
    const input = createUploadInput(config);

    input.onchange = e => {
      const fileList = (e.target as HTMLInputElement).files;
      if (!fileList) {
        return resolve([]);
      }

      const uploads = Array.from(fileList)
        .filter(f => f.name !== '.DS_Store')
        .map(file => new UploadedFile(file));
      resolve(uploads);
      input.remove();
    };

    document.body.appendChild(input);
    input.click();
  });
}
