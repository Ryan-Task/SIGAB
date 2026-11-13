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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 ${
          isMenuOpen ? "z-[70]" : "z-50"
        } border-b transition-all duration-500 ease-out ${
          isMenuOpen
            ? "border-transparent bg-transparent shadow-none backdrop-blur-0"
            : useLightNavigation
              ? "border-slate-300/60 bg-[#dfeaf0]/95 shadow-[0_8px_24px_rgba(38,102,154,0.12)] backdrop-blur-md"
              : "border-transparent bg-transparent shadow-none backdrop-blur-0"
        }`}
      >
      <div className="relative mx-auto flex max-w-[1280px] items-center justify-end gap-3 px-6 py-4 sm:gap-6">
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-600 md:flex">
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

        <button
          type="button"
          aria-label={isMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
          className={`relative z-[70] mr-auto rounded-full border p-2 transition md:hidden ${
            isMenuOpen
              ? "border-[#123d61] bg-white text-[#123d61] hover:bg-[#f4f7fb]"
              : useLightNavigation
                ? "border-[#26669a] text-[#26669a] hover:bg-white"
                : "border-white/40 text-white hover:bg-white/20"
          }`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
          </svg>
        </button>
        <Link
          href={user ? "/profil" : "/login"}
          className={`hidden rounded-full border px-4 py-2 text-xs font-semibold transition md:block ${
            useLightNavigation ? "border-[#26669a] text-[#26669a] hover:bg-white" : "border-white/40 text-white hover:bg-white/20"
          }`}
        >
          {user ? `Profil ${user.name}` : "Masuk"}
        </Link>
        {user && (
          <button type="button" onClick={() => logout().then(() => setUser(null))} className={`hidden rounded-full border px-4 py-2 text-xs font-semibold transition md:block ${
            useLightNavigation
              ? "border-red-300 bg-red-50 text-red-600 hover:border-red-500 hover:bg-red-100"
              : "border-red-300/70 bg-red-500/10 text-red-100 hover:border-red-200 hover:bg-red-500/20"
          }`}>
            Keluar
          </button>
        )}
      </div>

      </header>

      {isMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-[55] bg-transparent md:hidden"
          />
          <nav
            id="mobile-navigation"
            className="fixed inset-y-0 left-0 z-[60] w-[min(72vw,16rem)] overflow-y-auto border-r border-[#82d4d0]/60 bg-[#dfeaf0] px-3 pb-6 pt-24 text-xs font-semibold text-[#123d61] shadow-[8px_0_24px_rgba(0,0,0,0.12)] md:hidden"
          >
            {visibleNavItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-xl px-4 py-3 transition ${
                    active ? "bg-white text-[#26669a]" : "hover:bg-white/70 hover:text-[#26669a]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {adminLink && (
              <Link
                href={adminLink.href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-[#f38a50] transition hover:bg-white/70 hover:text-[#123d61]"
              >
                {adminLink.label}
              </Link>
            )}
            <div className="mt-4 border-t border-[#82d4d0]/60 pt-4">
              <Link
                href={user ? "/profil" : "/login"}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-xl border border-[#26669a] px-4 py-3 text-center text-[#26669a] transition hover:bg-white/70"
              >
                {user ? `Profil ${user.name}` : "Masuk"}
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={() => logout().then(() => {
                    setUser(null);
                    setIsMenuOpen(false);
                  })}
                  className="mt-3 block w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-600 transition hover:border-red-500 hover:bg-red-100"
                >
                  Keluar
                </button>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
