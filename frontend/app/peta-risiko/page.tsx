"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import SiteNav from "../components/SiteNav";

type RiskLevel = "Tinggi" | "Sedang" | "Rendah";

const riskAreas: { name: string; detail: string; score: number; level: RiskLevel; tone: string }[] = [
  { name: "Surabaya Barat", detail: "Dekat aliran sungai", score: 68, level: "Tinggi", tone: "#f38a50" },
  { name: "Surabaya Selatan", detail: "Curah hujan meningkat", score: 44, level: "Sedang", tone: "#82d4d0" },
  { name: "Surabaya Timur", detail: "Elevasi relatif aman", score: 22, level: "Rendah", tone: "#26669a" },
];

const riskColors: Record<RiskLevel, string> = {
  Tinggi: "bg-[#f38a50] text-[#123d61]",
  Sedang: "bg-[#82d4d0] text-[#123d61]",
  Rendah: "bg-[#26669a] text-white",
};

function Footer() {
  return (
    <footer className="bg-[#123d61] px-6 py-12 text-white">
      <div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#82d4d0] font-bold text-[#123d61]">S</span>
            <span className="text-lg font-semibold tracking-[0.12em]">SIGAB</span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-sky-100/70">
            Sistem Informasi Geografis Antisipasi Banjir untuk membantu masyarakat memahami risiko dan mempersiapkan tindakan.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#82d4d0]">Navigasi</h3>
          <div className="mt-4 space-y-3 text-sm text-sky-100/75">
            <Link href="/peta-risiko" className="block transition hover:text-white">Peta Risiko</Link>
            <Link href="/peringatan" className="block transition hover:text-white">Peringatan</Link>
            <Link href="/data-historis" className="block transition hover:text-white">Data Historis</Link>
            <Link href="/mitigasi" className="block transition hover:text-white">Mitigasi</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#82d4d0]">Catatan</h3>
          <p className="mt-4 text-sm leading-7 text-sky-100/70">
            Informasi SIGAB bersifat pendukung. Tetap ikuti arahan resmi BPBD, BMKG, dan instansi berwenang.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-[1180px] border-t border-white/10 pt-5 text-xs text-sky-100/50">
        © 2026 SIGAB. Dibuat untuk mendukung kesiapsiagaan masyarakat.
      </div>
    </footer>
  );
}

export default function PetaRisikoPage() {
  const [selectedArea, setSelectedArea] = useState(riskAreas[0]);
  const [filter, setFilter] = useState<"Semua" | RiskLevel>("Semua");
  const visibleAreas = filter === "Semua" ? riskAreas : riskAreas.filter((area) => area.level === filter);

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />

      <section className="bg-[#dfeaf0] px-6 pb-12 pt-32">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#26669a]">Eksplorasi wilayah</p>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.08em] text-[#123d61] sm:text-7xl">
                Peta risiko,<br />dibuat mudah dipahami.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
                Jelajahi gambaran risiko banjir per wilayah. Pilih area untuk melihat status, skor estimasi, dan faktor yang perlu diperhatikan.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#f38a50]" />
              Diperbarui hari ini
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[1.45fr_0.75fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative min-h-[570px] overflow-hidden rounded-[34px] bg-[#26669a] p-6 shadow-[0_24px_60px_rgba(38,102,154,0.2)] sm:p-8"
          >
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:46px_46px]" />
            <div className="absolute -right-20 top-28 h-80 w-80 rounded-full border-[34px] border-[#82d4d0]/25" />
            <div className="absolute -bottom-28 left-24 h-96 w-96 rounded-full border-[42px] border-[#f38a50]/20" />
            <div className="relative z-10 flex items-start justify-between gap-4 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82d4d0]">Peta interaktif</p>
                <h2 className="mt-2 text-2xl font-semibold">Surabaya dan sekitarnya</h2>
              </div>
              <span className="rounded-full bg-[#f38a50] px-3 py-1.5 text-xs font-bold text-[#123d61]">Waspada</span>
            </div>
            <div className="relative z-10 mt-10 h-[375px]">
              {riskAreas.map((area, index) => {
                const active = selectedArea.name === area.name;
                return (
                  <motion.button
                    key={area.name}
                    type="button"
                    onClick={() => setSelectedArea(area)}
                    animate={{ scale: active ? 1.18 : 1 }}
                    className="absolute flex items-center gap-2 text-left transition"
                    style={{ left: `${18 + index * 29}%`, top: `${54 - index * 18}%` }}
                    aria-label={`Pilih ${area.name}`}
                  >
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full border-4 border-white/80 shadow-lg" style={{ backgroundColor: area.tone }}>
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold shadow-md ${active ? "bg-white text-[#123d61]" : "bg-[#123d61]/80 text-white"}`}>
                      {area.name}
                    </span>
                  </motion.button>
                );
              })}
              <div className="absolute bottom-3 left-3 rounded-2xl border border-white/20 bg-[#123d61]/60 p-4 text-xs text-sky-100 backdrop-blur-md">
                Klik titik wilayah untuk melihat ringkasan risiko
              </div>
            </div>
            <div className="relative z-10 flex flex-wrap items-center gap-5 border-t border-white/20 pt-5 text-xs text-sky-100">
              {(["Tinggi", "Sedang", "Rendah"] as RiskLevel[]).map((level) => (
                <span key={level} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${level === "Tinggi" ? "bg-[#f38a50]" : level === "Sedang" ? "bg-[#82d4d0]" : "bg-[#123d61]"}`} />
                  Risiko {level.toLowerCase()}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.6 }}
            className="rounded-[34px] bg-[#f0e7e2] p-6 sm:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Wilayah terpilih</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <h2 className="text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">{selectedArea.name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${riskColors[selectedArea.level]}`}>{selectedArea.level}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{selectedArea.detail}</p>
            <div className="mt-8 flex items-end gap-3">
              <span className="text-7xl font-semibold leading-none tracking-[-0.1em] text-[#123d61]">{selectedArea.score}</span>
              <span className="pb-2 text-sm text-slate-500">skor estimasi<br />dari 100</span>
            </div>
            <div className="mt-6 h-2 rounded-full bg-white">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedArea.score}%` }}
                className="h-2 rounded-full bg-[#f38a50]"
              />
            </div>
            <div className="mt-8 border-t border-[#26669a]/15 pt-5 text-sm leading-7 text-slate-600">
              <p className="font-semibold text-[#123d61]">Apa artinya?</p>
              <p className="mt-1">Gunakan status ini sebagai gambaran awal dan periksa informasi resmi sebelum mengambil keputusan.</p>
            </div>
            <Link href={`/wilayah/${selectedArea.name.toLowerCase().replaceAll(" ", "-")}`} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123d61]">
              Lihat detail wilayah <span className="ml-2">↗</span>
            </Link>
          </motion.aside>
        </div>
      </section>

      <section className="bg-[#f0e7e2] px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Ringkasan wilayah</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61]">Bandingkan dengan cepat.</h2>
            </div>
            <div className="flex gap-2">
              {(["Semua", "Tinggi", "Sedang", "Rendah"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === item ? "bg-[#123d61] text-white" : "bg-white text-slate-600 hover:bg-[#82d4d0]"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-10 divide-y divide-[#26669a]/15 border-y border-[#26669a]/15">
            {visibleAreas.map((area, index) => (
              <motion.button
                key={area.name}
                type="button"
                onClick={() => setSelectedArea(area)}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="grid w-full gap-3 py-6 text-left transition hover:px-3 sm:grid-cols-[1.2fr_1fr_0.5fr_auto] sm:items-center"
              >
                <span className="font-semibold text-[#123d61]">{area.name}</span>
                <span className="text-sm text-slate-500">{area.detail}</span>
                <span className="text-2xl font-semibold text-[#123d61]">{area.score}</span>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${riskColors[area.level]}`}>{area.level}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#dfeaf0] px-6 py-20">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-7 rounded-[30px] bg-[#26669a] p-8 text-white sm:p-12 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82d4d0]">Langkah berikutnya</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">Sudah menemukan wilayah Anda?</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-sky-100/75">Baca faktor risiko dan saran kesiapsiagaan yang lebih lengkap di halaman detail wilayah.</p>
          </div>
          <Link href="/mitigasi" className="shrink-0 rounded-full bg-[#f38a50] px-6 py-3 text-sm font-bold text-[#123d61] transition hover:bg-[#ff9d67]">Baca panduan mitigasi</Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
