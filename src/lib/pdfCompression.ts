type PdfCompressionOptions = {
  maxInputBytes?: number;
  maxPages?: number;
  maxPageWidth?: number;
  jpegQuality?: number;
  minSavingsRatio?: number;
};

const DEFAULT_OPTIONS: Required<PdfCompressionOptions> = {
  maxInputBytes: 8 * 1024 * 1024,
  maxPages: 10,
  maxPageWidth: 1400,
  jpegQuality: 0.78,
  minSavingsRatio: 0.94,
};

export async function preparePdfForUpload(file: File, options: PdfCompressionOptions = {}) {
  if (file.type !== 'application/pdf') return file;

  const settings = { ...DEFAULT_OPTIONS, ...options };
  if (file.size > settings.maxInputBytes) {
    throw new Error(`PDF maksimal ${(settings.maxInputBytes / 1024 / 1024).toLocaleString('id-ID')} MB sebelum kompresi.`);
  }

  const source = await file.arrayBuffer();
  const [{ PDFDocument }, pdfjs] = await Promise.all([
    import('pdf-lib'),
    import('pdfjs-dist'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({ data: source.slice(0) });
  const pdf = await loadingTask.promise;

  if (pdf.numPages > settings.maxPages) {
    await pdf.destroy();
    throw new Error(`PDF maksimal ${settings.maxPages} halaman agar browser tidak berat.`);
  }

  const output = await PDFDocument.create();

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.5, settings.maxPageWidth / viewport.width);
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(scaledViewport.width));
      canvas.height = Math.max(1, Math.round(scaledViewport.height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Browser tidak mendukung canvas untuk kompresi PDF.');

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport: scaledViewport }).promise;

      const blob = await canvasToBlob(canvas, settings.jpegQuality);
      if (!blob) throw new Error('Gagal mengubah halaman PDF menjadi gambar terkompresi.');

      const imageBytes = await blob.arrayBuffer();
      const embedded = await output.embedJpg(imageBytes);
      const newPage = output.addPage([viewport.width, viewport.height]);
      newPage.drawImage(embedded, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });

      page.cleanup();
    }

    const outputBytes = await output.save({ useObjectStreams: true });
    if (outputBytes.byteLength >= file.size * settings.minSavingsRatio) return file;

    const basename = file.name.replace(/\.pdf$/i, '') || 'document';
    return new File([outputBytes], `${basename}-compressed.pdf`, { type: 'application/pdf', lastModified: Date.now() });
  } finally {
    await pdf.destroy();
  }
}

export async function buildPdfAwareUploadFormData(file: File, options?: PdfCompressionOptions) {
  const uploadFile = file.type === 'application/pdf' ? await preparePdfForUpload(file, options) : file;
  const formData = new FormData();
  formData.append('file', uploadFile);
  return formData;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}
