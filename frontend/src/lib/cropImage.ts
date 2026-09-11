export type CropArea = { x: number; y: number; width: number; height: number };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.src = url;
  });
}

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: CropArea,
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas indisponible');
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error('Recadrage impossible')),
      'image/jpeg',
      0.9,
    );
  });

  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}