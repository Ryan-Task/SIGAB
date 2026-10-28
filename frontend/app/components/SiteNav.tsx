"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-300/40 bg-[#dfeaf0]/90 backdrop-blur-md">
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
                className={`border-b-2 py-1 transition ${
                  active
                    ? "border-[#f38a50] text-[#26669a]"
                    : "border-transparent hover:border-[#82d4d0] hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/peta-risiko"
          className="rounded-full bg-[#26669a] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d527c]"
        >
          Lihat Peta
        </Link>
      </div>

      <nav className="mx-auto flex max-w-[1280px] gap-4 overflow-x-auto px-6 pb-3 text-xs font-semibold text-slate-600 xl:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-[#26669a]">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
