"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { label: "Beranda", href: "/admin" },
  { label: "Atur akun", href: "/admin/akun" },
  { label: "Riwayat", href: "/admin/riwayat" },
  { label: "Profil administrator", href: "/admin/profil" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#123d61]/95 text-white shadow-[0_12px_30px_rgba(18,61,97,0.24)] backdrop-blur ${isMenuOpen ? "z-[70]" : ""}`}>
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <Link href="/admin" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#82d4d0] text-sm font-black text-[#123d61] transition group-hover:rotate-3 group-hover:bg-white">S</span>
            <span>
              <span className="block text-sm font-black tracking-[0.12em]">SIGAB</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100/65">Administrasi</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-xs font-bold md:flex sm:gap-2">
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return <Link key={item.href} href={item.href} className={`rounded-full px-3 py-2 transition ${active ? "bg-white/15 text-[#82d4d0]" : "hover:bg-white/15 hover:text-[#82d4d0]"}`}>{item.label}</Link>;
            })}
            <Link href="/" className="ml-1 rounded-full bg-[#f38a50] px-3 py-2 text-[#123d61] transition hover:bg-[#ffb17e]">Dashboard biasa</Link>
          </nav>
          <button
            type="button"
            aria-label={isMenuOpen ? "Tutup menu admin" : "Buka menu admin"}
            aria-expanded={isMenuOpen}
            aria-controls="admin-mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-full border border-white/40 p-2 text-white transition hover:bg-white/15 md:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </header>
      {isMenuOpen && (
        <>
          <button type="button" aria-label="Tutup menu admin" onClick={() => setIsMenuOpen(false)} className="fixed inset-0 z-[55] bg-transparent md:hidden" />
          <nav id="admin-mobile-navigation" className="fixed inset-y-0 left-0 z-[60] w-[min(78vw,18rem)] overflow-y-auto border-r border-[#82d4d0]/60 bg-[#dfeaf0] px-3 pb-6 pt-24 text-xs font-semibold text-[#123d61] shadow-[8px_0_24px_rgba(0,0,0,0.12)] md:hidden">
            <p className="px-4 pb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#26669a]">Menu administrasi</p>
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className={`block rounded-xl px-4 py-3 transition ${active ? "bg-white text-[#26669a]" : "hover:bg-white/70 hover:text-[#26669a]"}`}>{item.label}</Link>;
            })}
            <div className="mt-4 border-t border-[#82d4d0]/60 pt-4">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="block rounded-xl bg-[#f38a50] px-4 py-3 text-center font-bold text-[#123d61] transition hover:bg-[#ffb17e]">Kembali ke dashboard biasa</Link>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
