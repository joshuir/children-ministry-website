"use client";

export type Storage = "blob" | "local";
export interface Uploaded { url: string; contentType: string; size: number; name: string }

const safeName = (n: string) => n.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80) || "file";

/** Downscale big photos in the browser before upload (keeps pages fast on phones). */
async function shrinkImage(file: File, max = 2400): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.2 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 3 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const type = file.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, type, 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, type === "image/webp" ? ".webp" : ".jpg"), { type });
  } catch {
    return file;
  }
}

export async function uploadFile(raw: File, folder: string, storage: Storage, onProgress?: (pct: number) => void): Promise<Uploaded> {
  const file = await shrinkImage(raw);
  if (storage === "blob") {
    const { upload } = await import("@vercel/blob/client");
    const res = await upload(`media/${folder}/${safeName(file.name)}`, file, {
      access: "public",
      handleUploadUrl: "/api/cms/upload",
      multipart: file.size > 20 * 1024 * 1024,
      onUploadProgress: (e) => onProgress?.(Math.round(e.percentage)),
    });
    return { url: res.url, contentType: res.contentType || file.type, size: file.size, name: file.name };
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    xhr.open("POST", "/api/cms/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: j.url, contentType: file.type, size: file.size, name: file.name });
        else reject(new Error(j.error || "Upload failed"));
      } catch { reject(new Error("Upload failed")); }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(fd);
  });
}

export const isVideo = (url?: string) => !!url && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
export const isImage = (url?: string) => !!url && /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(url);

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const fmtBytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n > 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`);

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
