import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TEAM_LABELS: Record<string, string> = {
  logistik: "Logistik (Zusammenpacken & Versand)",
  buchhaltung: "Buchhaltung",
  vertrieb: "Vertrieb",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, full_name, supplier_id, team_type, is_chief } = body;

    if (!email || !full_name || !supplier_id || !team_type) {
      return NextResponse.json(
        { error: "email, full_name, supplier_id, team_type erforderlich" },
        { status: 400 }
      );
    }
    if (!["logistik", "buchhaltung", "vertrieb"].includes(team_type)) {
      return NextResponse.json({ error: "Ungültiger team_type" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const { data: supplier } = await supabaseAdmin
      .from("suppliers")
      .select("id")
      .eq("id", supplier_id)
      .eq("user_id", user.id)
      .single();

    if (!supplier) {
      return NextResponse.json({ error: "Nur Admin kann Teammitglieder einladen" }, { status: 403 });
    }

    // Team ermitteln oder erstellen
    let { data: team } = await supabaseAdmin
      .from("supplier_teams")
      .select("id")
      .eq("supplier_id", supplier_id)
      .eq("team_type", team_type)
      .single();

    if (!team) {
      const { data: newTeam, error: teamErr } = await supabaseAdmin
        .from("supplier_teams")
        .insert({
          supplier_id,
          name: TEAM_LABELS[team_type] ?? team_type,
          team_type,
        })
        .select("id")
        .single();
      if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 });
      team = newTeam;
    }
    const teamId = (team as { id: string }).id;

    // Nächste Personal-ID ermitteln
    const { data: existing } = await supabaseAdmin
      .from("supplier_team_members")
      .select("personal_id")
      .eq("supplier_id", supplier_id)
      .not("personal_id", "is", null);
    const nums = (existing ?? [])
      .map((r: { personal_id: string | null }) => {
        const m = (r.personal_id ?? "").match(/^MIT-(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n: number) => n > 0);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const personalId = `MIT-${String(nextNum).padStart(3, "0")}`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${baseUrl}/auth/callback`;

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name },
      redirectTo,
    });

    if (inviteError) {
      if (inviteError.message?.toLowerCase().includes("already been registered") || inviteError.message?.toLowerCase().includes("already exists")) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const existingUser = users?.users?.find((u) => u.email === email);
        if (existingUser) {
          await supabaseAdmin.from("profiles").upsert(
            { id: existingUser.id, email, full_name, role: "lieferant" },
            { onConflict: "id" }
          );
          const { error: memberErr } = await supabaseAdmin.from("supplier_team_members").upsert(
            {
              supplier_id,
              team_id: teamId,
              user_id: existingUser.id,
              full_name,
              email,
              is_chief: !!is_chief,
              personal_id: personalId,
              invitation_status: "accepted",
              created_by: user.id,
            },
            { onConflict: "supplier_id,user_id" }
          );
          if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });
          return NextResponse.json({
            success: true,
            user_id: existingUser.id,
            personal_id: personalId,
            message: "User existiert bereits, wurde zum Team hinzugefügt.",
          });
        }
      }
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    const newUser = inviteData?.user;
    if (!newUser) {
      return NextResponse.json({ error: "Einladung konnte nicht gesendet werden" }, { status: 500 });
    }

    await supabaseAdmin.from("profiles").upsert(
      { id: newUser.id, email, full_name, role: "lieferant" },
      { onConflict: "id" }
    );

    const { error: memberErr } = await supabaseAdmin.from("supplier_team_members").insert({
      supplier_id,
      team_id: teamId,
      user_id: newUser.id,
      full_name,
      email,
      is_chief: !!is_chief,
      personal_id: personalId,
      invitation_status: "pending",
      created_by: user.id,
    });

    if (memberErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      return NextResponse.json({ error: memberErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user_id: newUser.id,
      personal_id: personalId,
      message: "Einladung wurde versendet. Der Mitarbeiter erhält eine E-Mail und kann sein Passwort erstellen.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 }
    );
  }
}
