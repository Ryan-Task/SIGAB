"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";

const alerts = [
  { area: "Surabaya Barat", title: "Hujan lebat terpantau", level: "Tinggi", time: "10 menit lalu", detail: "Debit air berpotensi meningkat di area dengan elevasi rendah." },
  { area: "Surabaya Selatan", title: "Potensi genangan lokal", level: "Sedang", time: "35 menit lalu", detail: "Waspadai jalan cekung dan area dengan drainase terbatas." },
  { area: "Surabaya Timur", title: "Pantauan normal", level: "Rendah", time: "1 jam lalu", detail: "Belum ada indikasi peningkatan risiko yang signifikan." },
];

export default function PeringatanPage() {
  const [active, setActive] = useState(0);
  const selected = alerts[active];

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />
      <section className="bg-[#123d61] px-6 pb-16 pt-32 text-white">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Pusat informasi</p>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.08em] sm:text-7xl">Waspada,<br />bukan panik.</h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-sky-100/75">Ringkasan kondisi terbaru untuk membantu Anda menentukan langkah dengan tenang dan cepat.</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-sky-100/70"><span className="h-2 w-2 animate-pulse rounded-full bg-[#f38a50]" />Live monitoring</div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            key={selected.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[32px] bg-[#f38a50] p-8 text-[#123d61] sm:p-12"
          >
            <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[34px] border-white/20" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Peringatan terpilih</p>
            <h2 className="mt-8 max-w-lg text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-5xl">{selected.title}</h2>
            <p className="mt-5 max-w-md text-base leading-8 text-[#123d61]/75">{selected.detail}</p>
            <div className="mt-12 flex items-end justify-between gap-4">
              <div><p className="text-sm font-semibold">{selected.area}</p><p className="mt-1 text-xs text-[#123d61]/60">{selected.time}</p></div>
              <span className="rounded-full bg-[#123d61] px-4 py-2 text-xs font-bold text-white">{selected.level}</span>
            </div>
          </motion.div>

          <div className="space-y-3">
            <div className="mb-5 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Daftar status</p><span className="text-xs text-slate-500">{alerts.length} wilayah dipantau</span></div>
            {alerts.map((alert, index) => (
              <button key={alert.area} type="button" onClick={() => setActive(index)} className={`group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition ${index === active ? "bg-white shadow-[0_12px_30px_rgba(38,102,154,0.12)]" : "hover:bg-white/60"}`}>
                <span className={`h-3 w-3 shrink-0 rounded-full ${alert.level === "Tinggi" ? "bg-[#f38a50]" : alert.level === "Sedang" ? "bg-[#82d4d0]" : "bg-[#26669a]"}`} />
                <span className="min-w-0 flex-1"><span className="block font-semibold text-[#123d61]">{alert.area}</span><span className="mt-1 block truncate text-sm text-slate-500">{alert.title}</span></span>
                <span className="text-slate-400 transition group-hover:translate-x-1">→</span>
              </button>
            ))}
            <div className="mt-6 rounded-2xl border border-[#26669a]/15 bg-[#f0e7e2] p-5 text-sm leading-7 text-slate-600"><strong className="text-[#123d61]">Sumber informasi</strong><br />Status ditampilkan sebagai informasi pendukung. Selalu ikuti arahan resmi BPBD dan BMKG.</div>
          </div>
        </div>
      </section>

      <section className="bg-[#f0e7e2] px-6 py-16">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Tindakan berikutnya</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Ingin memahami wilayah Anda?</h2></div><Link href="/peta-risiko" className="shrink-0 rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123d61]">Buka Peta Risiko</Link></div>
      </section>
      <SiteFooter />
    </main>
  );
}
