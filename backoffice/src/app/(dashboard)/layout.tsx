"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSupplierAccess } from "@/hooks/useSupplierAccess";

const baseNav = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/dashboard/produkte", label: "Produkte" },
  { href: "/dashboard/rechnungen", label: "Rechnungen" },
  { href: "/dashboard/kataloge", label: "Kataloge" },
];

const teamChiefNav = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/dashboard/rechnungen", label: "Rechnungen" },
  { href: "/dashboard/team/mein-team", label: "Mein Team" },
];

const roleNav: Record<string, { href: string; label: string }[]> = {
  logistik: [
    { href: "/dashboard", label: "Übersicht" },
    { href: "/dashboard/logistik", label: "Bestellungen" },
  ],
  buchhaltung: [
    { href: "/dashboard", label: "Übersicht" },
    { href: "/dashboard/buchhaltung", label: "Rechnungen" },
  ],
  vertrieb: [
    { href: "/dashboard", label: "Übersicht" },
    { href: "/dashboard/vertrieb", label: "Meine Kunden & Deals" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { supplierId, isAdmin, isTeamChief, teamType, loading: accessLoading } = useSupplierAccess(user?.id ?? null);

  const nav = useMemo(() => {
    if (isAdmin) return [...baseNav, { href: "/dashboard/team", label: "Team" }];
    if (isTeamChief) return teamChiefNav;
    if (teamType) return roleNav[teamType] ?? baseNav.slice(0, 2);
    return baseNav.slice(0, 2);
  }, [isAdmin, isTeamChief, teamType]);

  useEffect(() => {
    if (authLoading || accessLoading) return;
    if (!user || profile?.role !== "lieferant") {
      router.replace("/login");
      return;
    }
    if (!supplierId && !accessLoading) {
      router.replace("/login?error=access");
    }
  }, [user, profile, authLoading, accessLoading, supplierId, router]);

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-10 flex h-full w-64 flex-col border-r bg-white shadow-sm" style={{ borderColor: "var(--border)" }}>
        <div className="flex h-16 items-center border-b px-6" style={{ borderColor: "var(--border)" }}>
          <span className="font-reyna text-2xl tracking-wide text-stone-800">Reyna</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          <p className="truncate text-xs text-stone-500">{profile?.company_name || profile?.email}</p>
          <button
            onClick={handleSignOut}
            className="btn-ghost mt-2 w-full justify-start px-3 py-2 text-left"
          >
            Abmelden
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 overflow-auto bg-stone-50/50 p-8">{children}</main>
    </div>
  );
}
