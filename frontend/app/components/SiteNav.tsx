"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Beranda", href: "/" },
  { label: "Peta Risiko", href: "/peta-risiko" },
  { label: "Peringatan", href: "/peringatan" },
  { label: "Data Historis", href: "/data-historis" },
  { label: "Mitigasi", href: "/mitigasi" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isHome = pathname === "/";
  const useLightNavigation = isScrolled || !isHome;

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
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-500 ease-out ${
        useLightNavigation || isMenuOpen
          ? "border-slate-300/60 bg-[#dfeaf0]/95 shadow-[0_8px_24px_rgba(38,102,154,0.12)] backdrop-blur-md"
          : "border-transparent bg-transparent shadow-none backdrop-blur-0"
      }`}
    >
      <div className="relative mx-auto flex max-w-[1280px] items-center justify-end gap-4 px-6 py-4">
        <button
          type="button"
          className={`absolute left-6 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition md:hidden ${
            useLightNavigation || isMenuOpen
              ? "border-[#26669a]/20 text-[#26669a] hover:bg-[#26669a]/10"
              : "border-white/30 text-white hover:bg-white/10"
          }`}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="sr-only">
            {isMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          </span>
          <span className="flex w-4 flex-col gap-1" aria-hidden="true">
            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${
                isMenuOpen ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-0.5 w-full rounded-full bg-current transition ${
                isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-600 md:flex xl:gap-6 xl:text-[12px] xl:tracking-[0.06em]">
          {navItems.map((item) => {
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
        </nav>

        <Link
          href="/peta-risiko"
          className={`rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition ${
            useLightNavigation
              ? "bg-[#26669a] text-white hover:bg-[#1d527c]"
              : "border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          }`}
        >
          Lihat Peta
        </Link>
      </div>

      <nav
        id="mobile-navigation"
        className={`absolute left-0 right-0 top-full border-t px-6 py-4 text-xs font-semibold shadow-[0_8px_24px_rgba(38,102,154,0.12)] transition-all duration-300 md:hidden ${
          isMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        } ${
          useLightNavigation || isMenuOpen
            ? "border-slate-300/60 bg-[#dfeaf0]"
            : "border-white/15 bg-[#174b73]/95 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] flex-col gap-1">
          {navItems.map((item) => {
            const active = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-3 transition ${
                  useLightNavigation || isMenuOpen
                    ? active
                      ? "bg-[#26669a]/10 text-[#26669a]"
                      : "text-slate-600 hover:bg-[#26669a]/5 hover:text-[#26669a]"
                    : active
                      ? "bg-white/10 text-white"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
