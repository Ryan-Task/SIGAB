"use client";

import { motion } from "framer-motion";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";

const bars = [42, 68, 51, 82, 61, 93, 73, 56, 79, 64, 88, 70];
const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function DataHistorisPage() {
  return (
    <main className="min-h-screen bg-[#f0e7e2] text-slate-800">
      <SiteNav />
      <section className="bg-[#dfeaf0] px-6 pb-16 pt-32">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#26669a]">Membaca pola</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.08em] text-[#123d61] sm:text-7xl">Belajar dari<br />air yang pernah datang.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">Data historis membantu kita melihat pola, bukan meramal dengan pasti. Gunakan sebagai konteks untuk merencanakan kesiapsiagaan.</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Ringkasan 2021–2025</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61]">42 kejadian tercatat.</h2></div><span className="text-sm text-slate-500">Surabaya dan sekitarnya</span></div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_270px]">
            <div className="rounded-[32px] bg-[#123d61] p-6 text-white sm:p-8">
              <div className="flex items-center justify-between"><p className="text-sm text-sky-100/70">Intensitas kejadian per bulan</p><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#82d4d0]">Data ilustrasi</span></div>
              <div className="mt-10 flex h-64 items-end gap-2 border-b border-white/15 sm:gap-4">
                {bars.map((height, index) => <motion.div key={months[index]} initial={{ height: 0 }} whileInView={{ height: `${height}%` }} viewport={{ once: true }} transition={{ delay: index * 0.05, duration: 0.5 }} className="group relative flex-1 rounded-t-lg bg-[#82d4d0] transition hover:bg-[#f38a50]"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 transition group-hover:opacity-100">{height}</span></motion.div>)}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-sky-100/50">{months.map((month) => <span key={month}>{month}</span>)}</div>
            </div>
            <div className="space-y-4">
              <div className="rounded-[28px] bg-[#f38a50] p-6 text-[#123d61]"><p className="text-xs font-bold uppercase tracking-[0.16em]">Puncak tertinggi</p><p className="mt-5 text-5xl font-semibold tracking-[-0.08em]">93</p><p className="mt-2 text-sm">indikasi pada Juni</p></div>
              <div className="rounded-[28px] bg-[#82d4d0] p-6 text-[#123d61]"><p className="text-xs font-bold uppercase tracking-[0.16em]">Catatan</p><p className="mt-4 text-sm leading-7">Angka perlu dibaca bersama sumber dan waktu pembaruan data.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#dfeaf0] px-6 py-16"><div className="mx-auto max-w-[1180px]"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Cara membaca</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Cari pola, bukan kepastian.</h2></div></div><div className="mt-10 grid gap-8 border-t border-[#26669a]/20 pt-8 md:grid-cols-3">{["Bandingkan periode", "Periksa sumber", "Lihat pembaruan"].map((item, index) => <div key={item} className="flex gap-4"><span className="text-sm font-bold text-[#f38a50]">0{index + 1}</span><div><h3 className="font-semibold text-[#123d61]">{item}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{["Lihat perubahan dari bulan ke bulan.", "Pastikan data memiliki sumber yang jelas.", "Informasi lama tidak selalu mewakili kondisi sekarang."][index]}</p></div></div>)}</div></div></section>
      <SiteFooter />
    </main>
  );
}
