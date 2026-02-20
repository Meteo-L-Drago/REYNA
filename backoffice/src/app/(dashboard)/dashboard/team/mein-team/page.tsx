"use client";

import { useAuth } from "@/context/AuthContext";
import { useSupplierAccess } from "@/hooks/useSupplierAccess";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const ACCENT = "#BA943A";
const TEAM_LABELS: Record<string, string> = {
  logistik: "Logistik",
  buchhaltung: "Buchhaltung",
  vertrieb: "Vertrieb",
};

export default function MeinTeamPage() {
  const { user } = useAuth();
  const { supplierId, isTeamChief } = useSupplierAccess(user?.id ?? null);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<{ id: string; full_name: string; email: string; is_chief: boolean }[]>([]);
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    if (!supplierId || !user || !isTeamChief) return;
    (async () => {
      const { data: me } = await supabase
        .from("supplier_team_members")
        .select("team_id")
        .eq("supplier_id", supplierId)
        .eq("user_id", user.id)
        .eq("is_chief", true)
        .single();
      if (!me) return;
      const tid = (me as { team_id: string }).team_id;
      setMyTeamId(tid);
      const { data: t } = await supabase.from("supplier_teams").select("name, team_type").eq("id", tid).single();
      if (t) setTeamName((t as { name: string; team_type: string }).name);
      const { data: m } = await supabase
        .from("supplier_team_members")
        .select("id, full_name, email, is_chief")
        .eq("team_id", tid);
      setMembers((m ?? []) as typeof members);
    })();
  }, [supplierId, user?.id, isTeamChief]);

  if (!isTeamChief) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
        Nur Teamchefs haben Zugang zu dieser Seite.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Mein Team</h1>
      <p className="text-stone-600">Übersicht deiner Teammitglieder: {teamName}</p>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Rolle</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium text-stone-900">{m.full_name}</td>
                  <td>{m.email}</td>
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
    </div>
  );
}
