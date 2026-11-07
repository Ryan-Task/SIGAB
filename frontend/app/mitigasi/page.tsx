"use client";

import { motion } from "framer-motion";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";

const phases = [
  { title: "Sebelum banjir", color: "bg-[#82d4d0]", items: ["Simpan dokumen dan barang penting di tempat tinggi.", "Kenali jalur evakuasi dan titik berkumpul.", "Siapkan tas darurat dan kebutuhan keluarga."] },
  { title: "Saat banjir", color: "bg-[#f38a50]", items: ["Pantau informasi resmi dari BPBD atau BMKG.", "Matikan listrik jika air mulai masuk rumah.", "Jangan menerobos arus air dengan kendaraan."] },
  { title: "Setelah banjir", color: "bg-[#26669a]", items: ["Hindari air yang mungkin terkontaminasi.", "Periksa kondisi bangunan sebelum masuk.", "Dokumentasikan kerusakan untuk kebutuhan laporan."] },
];

export default function MitigasiPage() {
  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />
      <section className="bg-[#123d61] px-6 pb-20 pt-32 text-white">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Panduan aksi</p><h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.08em] sm:text-7xl">Siap sebelum<br />air meninggi.</h1><p className="mt-6 max-w-xl text-base leading-8 text-sky-100/75">Kesiapsiagaan tidak harus rumit. Mulai dari langkah kecil yang bisa dilakukan hari ini.</p></div>
          <div className="relative h-40 overflow-hidden rounded-[28px] bg-[#26669a] p-6"><div className="absolute -right-8 -top-16 h-48 w-48 rounded-full border-[30px] border-[#82d4d0]/30" /><p className="relative text-xs uppercase tracking-[0.18em] text-sky-100/70">Prinsip SIGAB</p><p className="relative mt-5 text-2xl font-semibold">Kenali. Pahami. Siapkan.</p></div>
        </div>
      </section>

      <section className="px-6 py-20"><div className="mx-auto max-w-[1180px]"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Checklist kesiapsiagaan</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61]">Panduan berdasarkan waktu.</h2></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{phases.map((phase, index) => <motion.article key={phase.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="overflow-hidden rounded-[30px] bg-white shadow-[0_16px_34px_rgba(38,102,154,0.08)]"><div className={`${phase.color} p-6 text-[#123d61]`}><span className="text-xs font-bold uppercase tracking-[0.18em]">0{index + 1}</span><h3 className="mt-8 text-2xl font-semibold tracking-[-0.05em]">{phase.title}</h3></div><div className="space-y-4 p-6">{phase.items.map((item) => <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dfeaf0] text-xs font-bold text-[#26669a]">✓</span>{item}</div>)}</div></motion.article>)}</div></div></section>

      <section className="bg-[#f0e7e2] px-6 py-20"><div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-8 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Bagikan kesiapan</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Satu keluarga siap, satu lingkungan lebih aman.</h2></div><div className="rounded-2xl border-l-4 border-[#f38a50] bg-white p-5 text-sm leading-7 text-slate-600">Simpan halaman ini dan bagikan panduan kepada orang terdekat.</div></div></section>
      <SiteFooter />
    </main>
  );
}
