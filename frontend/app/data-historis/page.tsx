"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { getHistorySummary, type ApiHistorySummary } from "../../lib/api";

const KECAMATAN: Record<string, string> = {
  "35.78.01": "Karang Pilang",
  "35.78.02": "Wonocolo",
  "35.78.03": "Rungkut",
  "35.78.04": "Wonokromo",
  "35.78.05": "Tegalsari",
  "35.78.06": "Sawahan",
  "35.78.07": "Genteng",
  "35.78.08": "Gubeng",
  "35.78.09": "Sukolilo",
  "35.78.10": "Tambaksari",
  "35.78.11": "Simokerto",
  "35.78.12": "Pabean Cantian",
  "35.78.13": "Bubutan",
  "35.78.14": "Tandes",
  "35.78.15": "Krembangan",
  "35.78.16": "Semampir",
  "35.78.17": "Kenjeran",
  "35.78.18": "Lakarsantri",
  "35.78.19": "Benowo",
  "35.78.20": "Wiyung",
  "35.78.21": "Dukuh Pakis",
  "35.78.22": "Gayungan",
  "35.78.23": "Jambangan",
  "35.78.24": "Tenggilis Mejoyo",
  "35.78.25": "Gunung Anyar",
  "35.78.26": "Mulyorejo",
  "35.78.27": "Sukomanunggal",
  "35.78.28": "Asem Rowo",
  "35.78.29": "Bulak",
  "35.78.30": "Pakal",
  "35.78.31": "Sambikerep",
  "35.15.01": "Tarik",
  "35.15.02": "Prambon",
  "35.15.03": "Krembung",
  "35.15.04": "Porong",
  "35.15.05": "Jabon",
  "35.15.06": "Tanggulangin",
  "35.15.07": "Candi",
  "35.15.08": "Sidoarjo",
  "35.15.09": "Tulangan",
  "35.15.10": "Wonoayu",
  "35.15.11": "Krian",
  "35.15.12": "Balongbendo",
  "35.15.13": "Taman",
  "35.15.14": "Sukodono",
  "35.15.15": "Buduran",
  "35.15.16": "Gedangan",
  "35.15.17": "Sedati",
  "35.15.18": "Waru",
};

function districtLabel(code: string | null): string {
  if (!code) return "-";
  return KECAMATAN[code] ?? code;
}

function dayLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function DataHistorisPage() {
  const [summary, setSummary] = useState<ApiHistorySummary | null>(null);
  const [selectedRegency, setSelectedRegency] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getHistorySummary(selectedRegency || undefined)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setError("Data historis belum dapat dimuat. Pastikan backend berjalan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRegency]);

  const rainfall = summary?.rainfall;
  const risk = summary?.risk;

  const maxDaily = Math.max(...(rainfall?.daily.map((d) => d.total_mm) ?? [0]), 1);
  const maxHourly = Math.max(...(rainfall?.hourly.map((h) => h.avg_mm) ?? [0]), 1);
  const maxBucket = Math.max(...(risk?.score_distribution.map((b) => b.count) ?? [0]), 1);
  const topDistricts = [...(rainfall?.districts ?? [])].sort((a, b) => b.total_mm - a.total_mm).slice(0, 15);
  const maxDistrict = Math.max(...topDistricts.map((d) => d.total_mm), 1);

  return (
    <main className="min-h-screen bg-[#f0e7e2] text-slate-800">
      <SiteNav />
      <section className="bg-[#dfeaf0] px-6 pb-16 pt-32">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#26669a]">Membaca pola</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.08em] text-[#123d61] sm:text-7xl">Belajar dari<br />air yang pernah datang.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">Data historis curah hujan dan skor risiko yang benar-benar tercatat di sistem untuk Surabaya dan Sidoarjo ditampilkan sebagai diagram, bukan angka ilustrasi.</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Data tercatat SIGAB</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61]">
                {loading ? "Memuat data..." : rainfall ? `${rainfall.wet_day_count} hari hujan tercatat di ${summary?.area_count ?? 0} wilayah.` : "Data belum tersedia."}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="history-regency" className="text-sm font-semibold text-[#123d61]">Wilayah:</label>
              <select
                id="history-regency"
                value={selectedRegency}
                onChange={(event) => setSelectedRegency(event.target.value)}
                className="rounded-full border border-[#26669a]/30 bg-white px-4 py-2 text-sm text-[#123d61]"
              >
                <option value="">Semua wilayah</option>
                <option value="35.15">Kabupaten Sidoarjo</option>
                <option value="35.78">Kota Surabaya</option>
              </select>
            </div>
          </div>

          {error && <p className="mt-8 rounded-2xl bg-red-100 p-5 text-sm text-red-800">{error}</p>}

          {loading && !error && (
            <div className="mt-10 rounded-[32px] bg-white p-10 text-center text-slate-500">
              <p className="font-semibold text-[#123d61]">Memuat data historis...</p>
              <p className="mt-2 text-sm">Mengambil rekaman hujan dan prediksi risiko dari server.</p>
            </div>
          )}

          {!loading && !error && rainfall && risk && (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total curah hujan", value: `${rainfall.total_mm.toLocaleString("id-ID", { maximumFractionDigits: 1 })} mm`, note: `${rainfall.from ? dayLabel(rainfall.from.slice(0, 10)) : "?"} – ${rainfall.to ? dayLabel(rainfall.to.slice(0, 10)) : "?"}` },
                  { label: "Wilayah terpantau", value: String(summary?.area_count ?? 0), note: `${rainfall.districts.length} kecamatan` },
                  { label: "Rata-rata skor risiko", value: `${risk.avg_score}`, note: `rentang ${risk.min_score}–${risk.max_score}` },
                  { label: "Prediksi risiko sedang", value: String(risk.levels.find((l) => l.level === "medium")?.count ?? 0), note: `dari ${summary?.area_count ?? 0} wilayah` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[24px] bg-white p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#123d61]">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[32px] bg-[#123d61] p-6 text-white sm:p-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-sky-100/70">Curah hujan per hari</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#82d4d0]">BMKG</span>
                  </div>
                  <div className="mt-8 flex min-h-56 items-end gap-3 border-b border-white/15">
                    {rainfall.daily.map((item) => (
                      <motion.div
                        key={item.day}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((item.total_mm / maxDaily) * 100, 2)}%` }}
                        className="group relative min-h-2 flex-1 rounded-t-lg bg-[#82d4d0] hover:bg-[#f38a50]"
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px]">{item.total_mm.toLocaleString("id-ID", { maximumFractionDigits: 0 })} mm</span>
                        <span className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-sky-100/60">{dayLabel(item.day)}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] bg-white p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#123d61]">Pola hujan 24 jam (rata-rata mm)</p>
                    <span className="rounded-full bg-[#dfeaf0] px-3 py-1 text-xs text-[#26669a]">Per jam</span>
                  </div>
                  <div className="mt-8 flex min-h-56 items-end gap-1 border-b border-slate-200">
                    {rainfall.hourly.map((item) => (
                      <div key={item.hour} className="group relative flex-1">
                        <div
                          className="rounded-t bg-[#26669a] transition-colors hover:bg-[#f38a50]"
                          style={{ height: `${Math.max((item.avg_mm / maxHourly) * 200, 2)}px` }}
                          title={`${String(item.hour).padStart(2, "0")}:00 — ${item.avg_mm} mm`}
                        />
                        {item.hour % 6 === 0 && (
                          <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">{String(item.hour).padStart(2, "0")}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[32px] bg-white p-6 sm:p-8">
                  <p className="text-sm font-semibold text-[#123d61]">Sebaran skor risiko wilayah</p>
                  <p className="mt-1 text-xs text-slate-500">Jumlah wilayah per rentang skor (0–100)</p>
                  <div className="mt-8 flex min-h-52 items-end gap-2 border-b border-slate-200">
                    {risk.score_distribution.map((item) => (
                      <div key={item.bucket} className="group relative flex-1">
                        <div
                          className="rounded-t bg-[#f38a50] transition-colors hover:bg-[#123d61]"
                          style={{ height: `${Math.max((item.count / maxBucket) * 190, 2)}px` }}
                          title={`${item.bucket}: ${item.count} wilayah`}
                        />
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">{item.count}</span>
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-slate-400">{item.bucket}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] bg-white p-6 sm:p-8">
                  <p className="text-sm font-semibold text-[#123d61]">Komponen skor rata-rata</p>
                  <p className="mt-1 text-xs text-slate-500">Kontribusi tiap komponen model risiko</p>
                  <div className="mt-6 space-y-5">
                    {risk.components.map((comp) => (
                      <div key={comp.key}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[#123d61]">{comp.label}</span>
                          <span className="text-slate-500">{comp.avg}</span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${comp.avg}%` }}
                            className={`h-full rounded-full ${comp.key === "rainfall" ? "bg-[#26669a]" : comp.key === "environment" ? "bg-[#82d4d0]" : comp.key === "drainage" ? "bg-[#f38a50]" : "bg-slate-300"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[32px] bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#123d61]">Curah hujan per kecamatan (15 tertinggi)</p>
                  <span className="text-xs text-slate-500">Total mm selama periode tercatat</span>
                </div>
                <div className="mt-6 space-y-3">
                  {topDistricts.map((item) => (
                    <div key={item.district_code} className="grid grid-cols-[140px_1fr_80px] items-center gap-3 text-sm sm:grid-cols-[180px_1fr_90px]">
                      <span className="truncate font-medium text-[#123d61]">{districtLabel(item.district_code)}</span>
                      <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.total_mm / maxDistrict) * 100}%` }}
                          className="h-full rounded-full bg-[#26669a]"
                        />
                      </div>
                      <span className="text-right text-xs text-slate-500">{item.total_mm.toLocaleString("id-ID", { maximumFractionDigits: 0 })} mm</span>
                    </div>
                  ))}
                </div>
              </div>

              {risk.regencies.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {risk.regencies.map((reg) => (
                    <div key={reg.regency_code} className="rounded-[28px] bg-[#123d61] p-6 text-white">
                      <p className="text-sm text-sky-100/70">{reg.regency_name}</p>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-2xl font-semibold">{reg.areas}</p>
                          <p className="text-[10px] uppercase tracking-wider text-sky-100/60">wilayah</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{reg.total_mm.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</p>
                          <p className="text-[10px] uppercase tracking-wider text-sky-100/60">mm hujan</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{reg.avg_score}</p>
                          <p className="text-[10px] uppercase tracking-wider text-sky-100/60">skor rata-rata</p>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-[#82d4d0]">{reg.medium_count} wilayah berisiko sedang</p>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-6 text-xs leading-6 text-slate-500">
                Sumber: {summary?.source.rainfall} — {summary?.source.risk}.
                {summary?.updated_at ? ` Data diperbarui ${new Date(summary.updated_at).toLocaleString("id-ID")}.` : ""}
                {risk.calculated_at ? ` Prediksi risiko dihitung ${new Date(risk.calculated_at).toLocaleString("id-ID")}.` : ""}
              </p>
            </>
          )}

          {!loading && !error && !summary && (
            <div className="mt-8 rounded-[28px] bg-white p-8 text-slate-600">
              <p className="font-semibold text-[#123d61]">Data historis belum tersedia.</p>
              <p className="mt-2 text-sm leading-7">Belum ada rekaman yang bisa ditampilkan. Tidak ada data dummy yang dipakai.</p>
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}