"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, logout, type AuthUser } from "../../lib/api";

const navItems: Array<{ label: string; href: string; requiresAuth?: boolean }> = [
  { label: "Beranda", href: "/" },
  { label: "Peta Risiko", href: "/peta-risiko" },
  { label: "Peringatan", href: "/peringatan" },
  { label: "Data Historis", href: "/data-historis" },
  { label: "Mitigasi", href: "/mitigasi" },
  { label: "Daerah Anda", href: "/daerah-anda", requiresAuth: true },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const isHome = pathname === "/";
  const useLightNavigation = isScrolled || !isHome;
  const visibleNavItems = navItems.filter((item) => !item.requiresAuth || user !== null);
  const adminLink = user?.is_admin ? { label: "Dashboard Admin", href: "/admin" } : null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, [pathname]);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-500 ease-out ${
        useLightNavigation
          ? "border-slate-300/60 bg-[#dfeaf0]/95 shadow-[0_8px_24px_rgba(38,102,154,0.12)] backdrop-blur-md"
          : "border-transparent bg-transparent shadow-none backdrop-blur-0"
      }`}
    >
      <div className="relative mx-auto flex max-w-[1280px] items-center justify-end gap-6 px-6 py-4">
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-600 xl:flex">
          {visibleNavItems.map((item) => {
            const active = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative py-1 transition ${
                  useLightNavigation
                    ? active
                      ? "text-[#26669a]"
                      : "text-slate-600 hover:text-slate-900"
                    : active
                      ? "text-white"
                      : "text-white/85 hover:text-white"
                }`}
              >
                {item.label}
                <svg
                  viewBox="0 0 56 7"
                  preserveAspectRatio="none"
                  className={`absolute -bottom-2 left-0 h-2 w-full overflow-visible transition-all duration-300 ${
                    active
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                  }`}
                  aria-hidden="true"
                >
                  <path
                    d="M1 3.5C5 0 9 0 13 3.5s8 3.5 12 0 8-3.5 12 0 8 3.5 12 0 4-3.5 6-1"
                    fill="none"
                    stroke={active ? "#f38a50" : "#82d4d0"}
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              </Link>
            );
          })}
          {adminLink && <Link href={adminLink.href} className="py-1 text-[#f38a50] hover:text-[#123d61]">{adminLink.label}</Link>}
        </nav>

        <Link
          href={user ? "/profil" : "/login"}
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
            useLightNavigation ? "border-[#26669a] text-[#26669a] hover:bg-white" : "border-white/40 text-white hover:bg-white/20"
          }`}
        >
          {user ? `Profil ${user.name}` : "Masuk"}
        </Link>
        {user && (
          <button type="button" onClick={() => logout().then(() => setUser(null))} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
            useLightNavigation
              ? "border-red-300 bg-red-50 text-red-600 hover:border-red-500 hover:bg-red-100"
              : "border-red-300/70 bg-red-500/10 text-red-100 hover:border-red-200 hover:bg-red-500/20"
          }`}>
            Keluar
          </button>
        )}
      </div>

      <nav
        className={`mx-auto flex max-w-[1280px] gap-4 overflow-x-auto px-6 pb-3 text-xs font-semibold xl:hidden ${
          useLightNavigation ? "text-slate-600" : "text-white/85"
        }`}
      >
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap ${
              useLightNavigation ? "hover:text-[#26669a]" : "hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
        {adminLink && <Link href={adminLink.href} className="whitespace-nowrap text-[#f38a50] hover:text-[#123d61]">{adminLink.label}</Link>}
      </nav>
    </header>
  );
}
