"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupplierAccess } from "@/hooks/useSupplierAccess";
import { supabase } from "@/lib/supabase";

const TEAM_LABELS: Record<string, string> = {
  logistik: "Logistik (Zusammenpacken & Versand)",
  buchhaltung: "Buchhaltung",
  vertrieb: "Vertrieb",
};

export default function TeamAdminPage() {
  const { user } = useAuth();
  const { supplierId, isAdmin } = useSupplierAccess(user?.id ?? null);
  const [members, setMembers] = useState<{ id: string; user_id: string; full_name: string; email: string; is_chief: boolean; team_type: string; personal_id: string | null; invitation_status: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supplierId || !isAdmin) return;
    fetchData();
  }, [supplierId, isAdmin]);

  async function fetchData() {
    if (!supplierId) return;
    const { data: membersData } = await supabase
      .from("supplier_team_members")
      .select("id, user_id, full_name, email, is_chief, team_id, personal_id, invitation_status")
      .eq("supplier_id", supplierId);
    const membersWithTeam = await Promise.all(
      (membersData ?? []).map(async (m: { id: string; user_id: string; full_name: string; email: string; is_chief: boolean; team_id: string; personal_id: string | null; invitation_status: string | null }) => {
        const { data: t } = await supabase.from("supplier_teams").select("team_type").eq("id", m.team_id).single();
        return { ...m, team_type: (t as { team_type?: string })?.team_type ?? "–" };
      })
    );
    setMembers(membersWithTeam);
    setLoading(false);
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Nur Administratoren haben Zugang zu dieser Seite.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Team verwalten</h1>
        <button onClick={() => setShowInvite(true)} className="btn-primary">
          + Teammitglied einladen
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="card">
        <h2 className="card-header text-base font-semibold text-stone-900">Teammitglieder</h2>
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Personal-ID</th>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Team</th>
                <th>Status</th>
                <th>Rolle</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-stone-600">{m.personal_id ?? "–"}</td>
                  <td className="font-medium text-stone-900">{m.full_name}</td>
                  <td>{m.email}</td>
                  <td>{TEAM_LABELS[m.team_type] ?? m.team_type}</td>
                  <td>
                    {(m.invitation_status ?? "accepted") === "pending" ? (
                      <span className="badge bg-amber-100 text-amber-800">Einladung ausstehend</span>
                    ) : (
                      <span className="badge bg-emerald-50 text-emerald-700">Akzeptiert</span>
                    )}
                  </td>
                  <td>
                    {m.is_chief ? (
                      <span className="badge bg-amber-100 text-amber-800">Teamchef</span>
                    ) : (
                      <span className="text-stone-500">Mitglied</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {members.some((m) => m.team_type === "vertrieb") && (
        <Kundenzuordnung supplierId={supplierId!} vertriebMembers={members.filter((m) => m.team_type === "vertrieb")} onUpdate={fetchData} />
      )}

      {showInvite && supplierId && (
        <InviteMemberModal
          supplierId={supplierId}
          onClose={() => setShowInvite(false)}
          onSaved={() => {
            setShowInvite(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function Kundenzuordnung({
  supplierId,
  vertriebMembers,
  onUpdate,
}: {
  supplierId: string;
  vertriebMembers: { user_id: string; full_name: string }[];
  onUpdate: () => void;
}) {
  const [customers, setCustomers] = useState<{ gastronom_id: string; name: string }[]>([]);
  const [assignments, setAssignments] = useState<{ gastronom_id: string; vertrieb_user_id: string }[]>([]);
  const [vertriebId, setVertriebId] = useState("");
  const [gastronomId, setGastronomId] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAssignments = async () => {
    const { data: a } = await supabase.from("customer_vertrieb_assignments").select("gastronom_id, vertrieb_user_id").eq("supplier_id", supplierId);
    setAssignments((a ?? []) as { gastronom_id: string; vertrieb_user_id: string }[]);
  };

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from("orders").select("gastronom_id").eq("supplier_id", supplierId);
      const ids = [...new Set((orders ?? []).map((o: { gastronom_id: string }) => o.gastronom_id))];
      const { data: rests } = await supabase.from("restaurants").select("gastronom_id, name").in("gastronom_id", ids);
      setCustomers((rests ?? []).map((r: { gastronom_id: string; name: string }) => ({ gastronom_id: r.gastronom_id, name: r.name })));
      await loadAssignments();
    })();
  }, [supplierId]);

  async function handleAdd() {
    if (!vertriebId || !gastronomId) return;
    setSaving(true);
    await supabase.from("customer_vertrieb_assignments").upsert(
      { supplier_id: supplierId, gastronom_id: gastronomId, vertrieb_user_id: vertriebId },
      { onConflict: "supplier_id,gastronom_id" }
    );
    await loadAssignments();
    onUpdate();
    setSaving(false);
    setGastronomId("");
  }

  async function handleRemove(gastronomIdToRemove: string) {
    await supabase.from("customer_vertrieb_assignments").delete().eq("supplier_id", supplierId).eq("gastronom_id", gastronomIdToRemove);
    await loadAssignments();
    onUpdate();
  }

  const customerMap = Object.fromEntries(customers.map((c) => [c.gastronom_id, c.name]));
  const vertriebMap = Object.fromEntries(vertriebMembers.map((m) => [m.user_id, m.full_name]));

  return (
    <div className="card p-6">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Vertrieb: Kunden zuordnen</h2>
      <p className="mb-5 text-sm text-stone-600">Ordne Gastronomen einem Vertriebler zu. Nur zugeordnete Kunden erscheinen in dessen Übersicht.</p>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Vertriebler</label>
          <select value={vertriebId} onChange={(e) => setVertriebId(e.target.value)} className="select-field min-w-[180px]">
            <option value="">– wählen –</option>
            {vertriebMembers.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Kunde (Restaurant)</label>
          <select value={gastronomId} onChange={(e) => setGastronomId(e.target.value)} className="select-field min-w-[180px]">
            <option value="">– wählen –</option>
            {customers.map((c) => (
              <option key={c.gastronom_id} value={c.gastronom_id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button onClick={handleAdd} disabled={saving || !vertriebId || !gastronomId} className="btn-primary">
          Zuordnen
        </button>
      </div>
      {assignments.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-stone-200">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Kunde</th>
                <th>Vertriebler</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.gastronom_id}>
                  <td>{customerMap[a.gastronom_id] ?? a.gastronom_id}</td>
                  <td>{vertriebMap[a.vertrieb_user_id] ?? a.vertrieb_user_id}</td>
                  <td>
                    <button type="button" onClick={() => handleRemove(a.gastronom_id)} className="btn-ghost px-2 py-1 text-xs text-red-600 hover:text-red-700">
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InviteMemberModal({
  supplierId,
  onClose,
  onSaved,
}: {
  supplierId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [teamType, setTeamType] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isChief, setIsChief] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { session } = useAuth();

  function resetModal() {
    setStep(1);
    setTeamType(null);
    setEmail("");
    setFullName("");
    setIsChief(false);
    setError("");
    setSuccessMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !fullName || !teamType) {
      setError("Alle Felder ausfüllen.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/invite-team-member", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ email, full_name: fullName, supplier_id: supplierId, team_type: teamType, is_chief: isChief }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Fehler");
      return;
    }
    setSuccessMessage(data.message + (data.personal_id ? ` Personal-ID: ${data.personal_id}` : ""));
    setTimeout(() => onSaved(), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-stone-900">
          {step === 1 ? "Team auswählen" : "Teammitglied einladen"}
        </h2>

        {step === 1 ? (
          <>
            <p className="mt-2 text-sm text-stone-600">
              Wähle zuerst, welchem Team der Mitarbeiter zugeordnet werden soll:
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {(["logistik", "buchhaltung", "vertrieb"] as const).map((tt) => (
                <button
                  key={tt}
                  type="button"
                  onClick={() => {
                    setTeamType(tt);
                    setStep(2);
                    setError("");
                  }}
                  className="btn-secondary w-full justify-center py-3 text-base"
                >
                  {TEAM_LABELS[tt]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {successMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {successMessage}
              </div>
            ) : (
              <>
                {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <button
                  type="button"
                  onClick={() => { setStep(1); setTeamType(null); setError(""); }}
                  className="mb-2 text-xs text-stone-500 hover:text-stone-700"
                >
                  ← Anderes Team wählen
                </button>
                <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                  Team: {teamType ? TEAM_LABELS[teamType] : ""}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">E-Mail *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="mitarbeiter@firma.de"
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-stone-500">Der Mitarbeiter erhält eine E-Mail und kann sein Passwort selbst festlegen.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Name *</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="input-field" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="chief" checked={isChief} onChange={(e) => setIsChief(e.target.checked)} className="h-4 w-4 rounded border-stone-300" />
                  <label htmlFor="chief" className="text-sm font-medium text-stone-700">Als Teamchef</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { onClose(); resetModal(); }} className="btn-secondary flex-1">
                    Abbrechen
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? "Einladung wird gesendet…" : "Einladen"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {step === 1 && (
          <button type="button" onClick={() => { onClose(); resetModal(); }} className="btn-ghost mt-4 w-full">
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );
}
