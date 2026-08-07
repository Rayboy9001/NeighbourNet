/**
 * Client-side image compression. Downscales to a max edge and re-encodes as
 * JPEG/WebP so uploads are small and report images load fast.
 * Runs in the browser only; falls back to the original file on any failure.
 */
export async function compressImage(
  file: File,
  opts: { maxEdge?: number; quality?: number } = {},
): Promise<File> {
  const { maxEdge = 1600, quality = 0.72 } = opts;
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
