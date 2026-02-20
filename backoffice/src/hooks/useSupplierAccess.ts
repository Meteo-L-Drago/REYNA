"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type TeamType = "logistik" | "buchhaltung" | "vertrieb";

export interface SupplierAccess {
  supplierId: string | null;
  isAdmin: boolean;
  isTeamChief: boolean;
  teamType: TeamType | null;
  loading: boolean;
}

export function useSupplierAccess(userId: string | null): SupplierAccess {
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamChief, setIsTeamChief] = useState(false);
  const [teamType, setTeamType] = useState<TeamType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccess = useCallback(async () => {
    if (!userId) {
      setSupplierId(null);
      setIsAdmin(false);
      setIsTeamChief(false);
      setTeamType(null);
      setLoading(false);
      return;
    }
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (supplier) {
      setSupplierId(supplier.id);
      setIsAdmin(true);
      setIsTeamChief(false);
      setTeamType(null);
      setLoading(false);
      return;
    }
    const { data: member } = await supabase
      .from("supplier_team_members")
      .select("supplier_id, is_chief, team_id")
      .eq("user_id", userId)
      .single();
    if (member) {
      const m = member as { supplier_id: string; is_chief: boolean; team_id: string };
      setSupplierId(m.supplier_id);
      setIsAdmin(false);
      setIsTeamChief(m.is_chief);
      const { data: team } = await supabase.from("supplier_teams").select("team_type").eq("id", m.team_id).single();
      setTeamType((team as { team_type?: TeamType })?.team_type ?? null);
    } else {
      setSupplierId(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  return { supplierId, isAdmin, isTeamChief, teamType, loading };
}
