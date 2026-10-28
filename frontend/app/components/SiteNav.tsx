"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Beranda", href: "/" },
  { label: "Peta Risiko", href: "/peta-risiko" },
  { label: "Wilayah", href: "/wilayah/surabaya" },
  { label: "Peringatan", href: "/peringatan" },
  { label: "Data Historis", href: "/data-historis" },
  { label: "Mitigasi", href: "/mitigasi" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

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

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-500 ease-out ${
        isScrolled
          ? "border-slate-300/60 bg-[#dfeaf0]/95 shadow-[0_8px_24px_rgba(38,102,154,0.12)] backdrop-blur-md"
          : "border-transparent bg-transparent shadow-none backdrop-blur-0"
      }`}
    >
      <div className="relative mx-auto flex max-w-[1280px] items-center justify-end gap-6 px-6 py-4">
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-600 xl:flex">
          {navItems.map((item) => {
            const active = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative py-1 transition ${
                  isScrolled
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
            isScrolled
              ? "bg-[#26669a] text-white hover:bg-[#1d527c]"
              : "border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          }`}
        >
          Lihat Peta
        </Link>
      </div>

      <nav
        className={`mx-auto flex max-w-[1280px] gap-4 overflow-x-auto px-6 pb-3 text-xs font-semibold xl:hidden ${
          isScrolled ? "text-slate-600" : "text-white/85"
        }`}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap ${
              isScrolled ? "hover:text-[#26669a]" : "hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
