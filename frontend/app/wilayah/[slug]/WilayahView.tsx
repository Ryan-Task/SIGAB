"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Props = { wilayah: string };

export default function WilayahView({ wilayah }: Props) {
  const normalized = wilayah.replaceAll("-", " ");
  const title = normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const factors = [
    { label: "Curah hujan", value: "72 mm", width: "72%" },
    { label: "Riwayat banjir", value: "9 kejadian", width: "58%" },
    { label: "Elevasi wilayah", value: "5 mdpl", width: "80%" },
  ];

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <section className="bg-[#123d61] px-6 pb-16 pt-32 text-white"><div className="mx-auto max-w-[1180px]"><Link href="/peta-risiko" className="text-sm text-sky-100/70 transition hover:text-white">← Kembali ke peta risiko</Link><p className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Detail wilayah</p><div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><h1 className="text-5xl font-semibold tracking-[-0.08em] sm:text-7xl">{title}</h1><p className="mt-4 max-w-xl text-base leading-8 text-sky-100/75">Gambaran kondisi, faktor risiko, dan saran yang perlu diperhatikan di wilayah ini.</p></div><span className="w-fit rounded-full bg-[#f38a50] px-4 py-2 text-sm font-bold text-[#123d61]">Waspada</span></div></div></section>

      <section className="px-6 py-16"><div className="mx-auto max-w-[1180px]"><div className="grid gap-5 md:grid-cols-3">{[["Skor risiko", "68", "dari 100"], ["Curah hujan", "72", "mm"], ["Pembaruan", "Hari ini", "10:30 WIB"]].map(([label, value, suffix], index) => <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`${index === 0 ? "bg-[#f38a50]" : "bg-white"} rounded-[28px] p-7 ${index === 0 ? "text-[#123d61]" : ""}`}><p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{label}</p><p className="mt-6 text-5xl font-semibold tracking-[-0.08em]">{value}</p><p className="mt-2 text-sm opacity-70">{suffix}</p></motion.div>)}</div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.75fr]"><div className="rounded-[30px] bg-[#26669a] p-8 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#82d4d0]">Faktor yang memengaruhi</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em]">Kenapa statusnya waspada?</h2><div className="mt-8 space-y-6">{factors.map((factor) => <div key={factor.label}><div className="flex justify-between text-sm"><span>{factor.label}</span><span className="text-[#82d4d0]">{factor.value}</span></div><div className="mt-2 h-2 rounded-full bg-white/15"><motion.div initial={{ width: 0 }} animate={{ width: factor.width }} transition={{ duration: 0.8 }} className="h-2 rounded-full bg-[#f38a50]" /></div></div>)}</div></div><div className="rounded-[30px] bg-[#f0e7e2] p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f38a50]">Saran singkat</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Siapkan lebih awal.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Letakkan barang penting di tempat tinggi, pantau informasi resmi, dan kenali jalur menuju tempat aman.</p><Link href="/mitigasi" className="mt-8 inline-flex rounded-full bg-[#123d61] px-5 py-3 text-sm font-bold text-white">Baca panduan mitigasi</Link></div></div></div></section>
      <section className="bg-[#f0e7e2] px-6 py-16"><div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Lanjutkan eksplorasi</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Lihat riwayat wilayah ini.</h2></div><Link href="/data-historis" className="rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white">Data Historis ↗</Link></div></section>
    </main>
  );
}
