import { supabase } from "./supabase";

const BUCKET_PRODUCT_IMAGES = "product-images";
const BUCKET_CATALOGS = "catalogs";

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export async function uploadProductImage(
  supplierId: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${supplierId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_PRODUCT_IMAGES)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) return { url: "", path: "", error: error.message };

  const { data: urlData } = supabase.storage
    .from(BUCKET_PRODUCT_IMAGES)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}

export async function uploadCatalog(
  supplierId: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${supplierId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_CATALOGS)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) return { url: "", path: "", error: error.message };

  const { data: urlData } = supabase.storage
    .from(BUCKET_CATALOGS)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}
