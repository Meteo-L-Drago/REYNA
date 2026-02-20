"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupplierId } from "@/hooks/useSupplierOrders";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { supabase } from "@/lib/supabase";
import { uploadProductImage } from "@/lib/storage";

const ACCENT = "#BA943A";

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function ProduktePage() {
  const { user } = useAuth();
  const supplierId = useSupplierId(user?.id ?? null);
  const { products, loading, refetch } = useSupplierProducts(supplierId);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (search)
      list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter)
      list = list.filter((p) => p.category === categoryFilter);
    return list;
  }, [products, search, categoryFilter]);

  async function handleStatusChange(id: string, isAvailable: boolean) {
    setSaving(true);
    const { error: err } = await supabase
      .from("products")
      .update({ is_available: isAvailable })
      .eq("id", id);
    if (err) setError(err.message);
    else refetch();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Produkt wirklich löschen?")) return;
    setSaving(true);
    const { error: err } = await supabase.from("products").delete().eq("id", id);
    if (err) setError(err.message);
    else refetch();
    setSaving(false);
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Produkte</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-auto min-w-[180px]"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select-field w-auto min-w-[160px]"
          >
            <option value="">Alle Kategorien</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            + Produkt
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Bild</th>
                <th>Name</th>
                <th>Preis</th>
                <th>Einheit</th>
                <th>Kategorie</th>
                <th>Status</th>
                <th className="text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-stone-100">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-stone-400 text-xs">–</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                  <td className="px-4 py-3" style={{ color: ACCENT }}>
                    {formatEuro(p.price)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{p.unit}</td>
                  <td className="px-4 py-3 text-stone-600">{p.category ?? "–"}</td>
                  <td>
                    <button
                      onClick={() => handleStatusChange(p.id, !p.is_available)}
                      disabled={saving}
                      className={`badge ${p.is_available ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}
                    >
                      {p.is_available ? "Aktiv" : "Deaktiviert"}
                    </button>
                  </td>
                  <td className="text-right">
                    <button onClick={() => setEditingId(p.id)} className="btn-ghost px-2 py-1 text-xs">
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="ml-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-stone-500">
            {products.length === 0 ? "Noch keine Produkte." : "Keine Treffer."}
          </p>
        )}
      </div>

      {showAdd && supplierId && (
        <ProductForm
          supplierId={supplierId}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            refetch();
          }}
        />
      )}

      {editingId && supplierId && (
        <ProductForm
          supplierId={supplierId}
          productId={editingId}
          product={products.find((x) => x.id === editingId) ?? undefined}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  supplierId,
  productId,
  product,
  onClose,
  onSaved,
}: {
  supplierId: string;
  productId?: string;
  product?: { name: string; price: number; unit: string; category: string | null; description: string | null; image_url: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? (product.price / 100).toFixed(2) : "");
  const [unit, setUnit] = useState(product?.unit ?? "Stück");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name eingeben.");
      return;
    }
    const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      setError("Gültigen Preis eingeben.");
      return;
    }
    setSaving(true);
    let imageUrl = product?.image_url ?? null;
    if (imageFile) {
      const upload = await uploadProductImage(supplierId, imageFile);
      if (upload.error) {
        setError(upload.error);
        setSaving(false);
        return;
      }
      imageUrl = upload.url;
    }
    if (productId) {
      const { error: err } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          price: priceCents,
          unit: unit.trim() || "Stück",
          category: category.trim() || null,
          description: description.trim() || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);
      if (err) setError(err.message);
      else onSaved();
    } else {
      const { error: err } = await supabase.from("products").insert({
        supplier_id: supplierId,
        name: name.trim(),
        price: priceCents,
        unit: unit.trim() || "Stück",
        category: category.trim() || null,
        description: description.trim() || null,
        image_url: imageUrl,
        is_available: true,
      });
      if (err) setError(err.message);
      else onSaved();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-auto p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-stone-900">
          {productId ? "Produkt bearbeiten" : "Neues Produkt"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Preis (€) *</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12.50"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Einheit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Stück, kg…"
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Kategorie</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="z.B. Getränke, Frischware"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Bild</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="input-field cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:text-stone-700"
            />
            {product?.image_url && !imageFile && (
              <p className="mt-1 text-xs text-stone-500">Aktuelles Bild vorhanden. Neues wählen zum Ersetzen.</p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Abbrechen
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
