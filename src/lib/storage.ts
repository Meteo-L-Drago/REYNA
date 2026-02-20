/**
 * REYNA: Supabase Storage - Bild-Upload
 */

import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const BUCKET_PRODUCT_IMAGES = 'product-images';
const BUCKET_AVATARS = 'avatars';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Produktbild hochladen (für Lieferanten)
 * @param supplierId - ID des Lieferanten (für Ordnerstruktur)
 * @param source - Lokale URI (file://) ODER Base64-String direkt von ImagePicker (empfohlen für iOS)
 * @param fileName - Dateiname (z.B. "produkt-123.jpg")
 */
export async function uploadProductImage(
  supplierId: string,
  source: string,
  fileName?: string
): Promise<UploadResult> {
  const ext = fileName?.split('.').pop() || 'jpg';
  const path = `${supplierId}/${Date.now()}.${ext}`;

  let base64: string;
  const isFileUri = source.startsWith('file://') || source.startsWith('ph://') || source.startsWith('assets-library');
  if (!isFileUri) {
    base64 = source.includes(',') ? source.split(',')[1]! : source;
  } else {
    try {
      base64 = await FileSystem.readAsStringAsync(source, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (e) {
      return { url: '', path: '', error: 'Bild konnte nicht gelesen werden. Bitte erneut wählen.' };
    }
  }
  const arrayBuffer = base64ToArrayBuffer(base64);

  const { data, error } = await supabase.storage
    .from(BUCKET_PRODUCT_IMAGES)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    return { url: '', path: '', error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_PRODUCT_IMAGES)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}

/**
 * Avatar hochladen (für User)
 * @param userId - auth.uid()
 * @param fileUri - Lokaler URI der Bilddatei
 */
export async function uploadAvatar(
  userId: string,
  fileUri: string
): Promise<UploadResult> {
  const path = `${userId}/avatar.jpg`;

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = base64ToArrayBuffer(base64);

  const { data, error } = await supabase.storage
    .from(BUCKET_AVATARS)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    return { url: '', path: '', error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_AVATARS)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}
