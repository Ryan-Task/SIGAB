"use client";

import Link from "next/link";

export default function AdminNav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-300/60 bg-[#123d61] shadow-[0_8px_24px_rgba(18,61,97,0.2)]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">Dashboard Admin SIGAB</p>
        <Link href="/" className="rounded-full border border-white/50 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
          Kembali ke dashboard biasa
        </Link>
      </div>
    </header>
  );
}
