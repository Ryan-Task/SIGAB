"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";

const appSteps = [
  {
    number: "01",
    title: "Periksa peta risiko",
    description: "Cari wilayah dan baca skor risiko banjir dari 100, status risikonya, serta faktor yang memengaruhinya.",
    href: "/peta-risiko",
    action: "Buka peta risiko",
    color: "bg-[#26669a]",
  },
  {
    number: "02",
    title: "Baca peringatan wilayah",
    description: "Gunakan halaman peringatan untuk melihat wilayah yang sedang hujan dan perubahan kondisi terbaru.",
    href: "/peringatan",
    action: "Lihat peringatan",
    color: "bg-[#f38a50]",
  },
  {
    number: "03",
    title: "Simpan daerah pantauan",
    description: "Tambahkan daerah di profil agar skor risiko banjir dan kondisi cuacanya mudah dipantau dari satu halaman.",
    href: "/profil",
    action: "Atur daerah pantauan",
    color: "bg-[#82d4d0]",
  },
];

const preparationSteps = [
  ["Sebelum kondisi memburuk", "Simpan daerah pantauan, aktifkan notifikasi peringatan, dan kenali jalur menuju tempat aman."],
  ["Saat hujan atau risiko meningkat", "Periksa skor risiko banjir, baca peringatan terbaru, dan pantau informasi BPBD serta BMKG."],
  ["Saat harus mengungsi", "Matikan listrik jika aman dilakukan, bawa tas darurat, ikuti arahan petugas, dan jangan menerobos arus."],
  ["Setelah air surut", "Hindari air yang terkontaminasi, periksa bangunan sebelum masuk, dan laporkan kondisi melalui jalur resmi."],
];

export default function MitigasiPage() {
  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />
      <section className="bg-[#123d61] px-6 pb-20 pt-32 text-white">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Panduan mitigasi SIGAB</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.08em] sm:text-7xl">
                Gunakan informasi lebih awal, siapkan tindakan lebih cepat.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-sky-100/75">
                Mitigasi di SIGAB bukan hanya daftar tindakan darurat. Gunakan peta risiko, peringatan, data wilayah, dan notifikasi untuk mengambil keputusan sebelum keadaan memburuk.
              </p>
            </div>
            <div className="rounded-[28px] bg-[#26669a] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100/70">Prinsip penggunaan SIGAB</p>
              <p className="mt-5 text-3xl font-semibold leading-tight">Kenali kondisi. Pahami risikonya. Siapkan langkah berikutnya.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Fitur mitigasi digital</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61]">Mulai dari fitur yang tersedia di SIGAB.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">Setiap fitur membantu Anda memantau kondisi wilayah, memahami skor risiko banjir, dan menerima informasi yang relevan.</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {appSteps.map((step, index) => (
              <motion.article key={step.number} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="overflow-hidden rounded-[30px] bg-white shadow-[0_16px_34px_rgba(38,102,154,0.08)]">
                <div className={`${step.color} p-7 text-[#123d61]`}>
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">{step.number}</span>
                  <h3 className="mt-8 text-2xl font-semibold tracking-[-0.05em]">{step.title}</h3>
                </div>
                <div className="p-7">
                  <p className="text-sm leading-7 text-slate-600">{step.description}</p>
                  <Link href={step.href} className="mt-6 inline-flex rounded-full bg-[#123d61] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#26669a]">{step.action}</Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f0e7e2] px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Notifikasi peringatan</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61]">Terima informasi saat kondisi daerah berubah.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">Aktifkan notifikasi di Profil setelah menyimpan daerah pantauan. SIGAB dapat memberi peringatan ketika hujan terdeteksi atau skor risiko banjir berada pada tingkat tinggi.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Simpan daerah", "Pilih wilayah yang ingin dipantau melalui GPS atau pencarian manual."],
              ["Aktifkan notifikasi", "Berikan izin notifikasi browser dari halaman Profil."],
              ["Tetap siaga", "Notifikasi dapat diterima saat tab website tidak sedang terbuka selama server dan layanan push berjalan."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl bg-white p-6">
                <h3 className="font-semibold text-[#123d61]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
          <Link href="/profil" className="mt-8 inline-flex rounded-full bg-[#f38a50] px-5 py-3 text-sm font-bold text-[#123d61]">Aktifkan dari Profil</Link>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Langkah kesiapsiagaan</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.07em] text-[#123d61]">Tindakan yang dapat dilakukan berdasarkan situasi.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {preparationSteps.map(([title, description], index) => (
              <article key={title} className="rounded-[26px] border border-[#26669a]/10 bg-white p-7 shadow-[0_12px_28px_rgba(38,102,154,0.06)]">
                <div className="flex items-start gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dfeaf0] text-sm font-bold text-[#26669a]">0{index + 1}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-[#123d61]">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#123d61] px-6 py-16 text-white">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82d4d0]">Gunakan data dengan bijak</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.06em]">Informasi SIGAB membantu persiapan, bukan pengganti arahan resmi.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-100/75">Jika terjadi keadaan darurat, ikuti arahan BPBD, BMKG, pemerintah daerah, dan petugas di lapangan.</p>
          </div>
          <Link href="/data-historis" className="shrink-0 rounded-full bg-[#f38a50] px-5 py-3 text-sm font-bold text-[#123d61]">Buka data historis</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
