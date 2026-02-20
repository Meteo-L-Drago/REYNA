"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupplierId } from "@/hooks/useSupplierOrders";
import { useSupplierCatalogs } from "@/hooks/useSupplierCatalogs";
import { supabase } from "@/lib/supabase";
import { uploadCatalog } from "@/lib/storage";

export default function KatalogePage() {
  const { user } = useAuth();
  const supplierId = useSupplierId(user?.id ?? null);
  const { catalogs, loading, refetch } = useSupplierCatalogs(supplierId);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supplierId) return;
    if (file.type !== "application/pdf") {
      setError("Nur PDF-Dateien erlaubt.");
      return;
    }
    setError("");
    setUploading(true);
    const upload = await uploadCatalog(supplierId, file);
    if (upload.error) {
      setError(upload.error);
      setUploading(false);
      return;
    }
    const { error: insertErr } = await supabase.from("supplier_catalogs").insert({
      supplier_id: supplierId,
      name: file.name,
      file_path: upload.path,
      file_size: file.size,
    });
    if (insertErr) setError(insertErr.message);
    else refetch();
    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(id: string, filePath: string) {
    if (!confirm("Katalog wirklich löschen?")) return;
    setDeletingId(id);
    await supabase.storage.from("catalogs").remove([filePath]);
    await supabase.from("supplier_catalogs").delete().eq("id", id);
    refetch();
    setDeletingId(null);
  }

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from("catalogs").getPublicUrl(path);
    return data.publicUrl;
  }

  if (loading && catalogs.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Kataloge</h1>
        <label className="btn-primary cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? "Wird hochgeladen…" : "+ PDF hochladen"}
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Größe</th>
                <th>Datum</th>
                <th className="text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-stone-900">{c.name}</td>
                  <td>
                    {c.file_size ? `${(c.file_size / 1024).toFixed(1)} KB` : "–"}
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString("de-DE")}</td>
                  <td className="text-right">
                    <a
                      href={getPublicUrl(c.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost mr-2 px-2 py-1 text-xs"
                    >
                      Öffnen
                    </a>
                    <button
                      onClick={() => handleDelete(c.id, c.file_path)}
                      disabled={deletingId === c.id}
                      className="ml-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {catalogs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-stone-500">Noch keine Kataloge.</p>
            <p className="mt-2 text-sm text-stone-400">Lade PDF-Kataloge hoch, die Gastronomen einsehen können.</p>
          </div>
        )}
      </div>
    </div>
  );
}
