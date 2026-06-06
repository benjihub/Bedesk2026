interface ImageDimensions {
  width: number;
  height: number;
}

export async function getImageSize(file: File): Promise<ImageDimensions> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });

  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}
