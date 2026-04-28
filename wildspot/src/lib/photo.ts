import { supabase, PHOTOS_BUCKET } from './supabase';

const MAX_EDGE = 1600;
const QUALITY = 0.82;

async function readImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not read image.'));
      img.src = url;
    });
    return img;
  } finally {
    // Don't revoke yet — caller needs the loaded image.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function resizeToBlob(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }
  const img = await readImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available.');
  ctx.drawImage(img, 0, 0, w, h);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encoding failed.'))),
      'image/jpeg',
      QUALITY
    )
  );
  return blob;
}

export async function uploadPhoto(file: File, userId: string): Promise<string> {
  const blob = await resizeToBlob(file);
  const filename = `${crypto.randomUUID()}.jpg`;
  const path = `${userId}/${filename}`;
  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      cacheControl: '604800',
      upsert: false,
    });
  if (error) throw error;
  return path;
}

export async function photoSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
