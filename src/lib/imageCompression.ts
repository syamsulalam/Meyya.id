type CompressionOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  minSavingsRatio?: number;
};

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.84,
  minSavingsRatio: 0.95,
};

export async function prepareImageForUpload(file: File, options: CompressionOptions = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;
  if (file.type === 'image/webp' && file.size < 250 * 1024) return file;

  const settings = { ...DEFAULT_OPTIONS, ...options };

  try {
    const bitmap = await loadImageBitmap(file);
    const ratio = Math.min(1, settings.maxWidth / bitmap.width, settings.maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, settings.quality);
    if (!blob || blob.size >= file.size * settings.minSavingsRatio) return file;

    const basename = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${basename}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } catch (error) {
    console.warn('Image compression skipped:', error);
    return file;
  }
}

export async function buildImageUploadFormData(file: File, options?: CompressionOptions) {
  const uploadFile = await prepareImageForUpload(file, options);
  const formData = new FormData();
  formData.append('file', uploadFile);
  return formData;
}

async function loadImageBitmap(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', quality);
  });
}

