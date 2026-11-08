"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { getFloodEventYears, getFloodHistoryByYear, type ApiFloodHistory } from "../../lib/api";

const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function monthLabel(value: string): string {
  const [year, month] = value.split("-");
  return `${months[Number(month) - 1] ?? month} ${year}`;
}

export default function DataHistorisPage() {
  const [history, setHistory] = useState<ApiFloodHistory | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRegency, setSelectedRegency] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFloodEventYears()
      .then((availableYears) => {
        setYears(availableYears);
        if (availableYears[0] !== undefined) setSelectedYear(availableYears[0]);
      })
      .catch(() => setError("Daftar tahun historis belum dapat dimuat."));
  }, []);

  useEffect(() => {
    if (selectedYear === null) return;
    setHistory(null);
    getFloodHistoryByYear(selectedYear, selectedRegency).catch(() => setError("Data historis belum dapat dimuat.")).then((data) => {
      if (data) setHistory(data);
    });
  }, [selectedYear, selectedRegency]);

  const maxMonthly = Math.max(...(history?.monthly.map((item) => item.count) ?? [0]), 1);

  return (
    <main className="min-h-screen bg-[#f0e7e2] text-slate-800">
      <SiteNav />
      <section className="bg-[#dfeaf0] px-6 pb-16 pt-32">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#26669a]">Membaca pola</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.08em] text-[#123d61] sm:text-7xl">Belajar dari<br />air yang pernah datang.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">Riwayat kejadian yang tercatat untuk wilayah Surabaya dan Sidoarjo. Data ini berasal dari kejadian yang sudah diimpor dan diverifikasi, bukan angka ilustrasi.</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Riwayat DIBI BNPB</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61]">
                {history === null ? "Memuat data..." : `${history.total} kejadian tercatat.`}
              </h2>
            </div>
            <span className="text-sm text-slate-500">Surabaya dan Sidoarjo</span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
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
            <label htmlFor="history-year" className="text-sm font-semibold text-[#123d61]">Pilih tahun:</label>
            <select
              id="history-year"
              value={selectedYear ?? ""}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              disabled={years.length === 0}
              className="rounded-full border border-[#26669a]/30 bg-white px-4 py-2 text-sm text-[#123d61]"
            >
              {years.length === 0 ? <option value="">Belum ada tahun tersedia</option> : years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            {history && <span className="text-xs text-slate-500">Menampilkan histori {selectedRegency === "35.15" ? "Kabupaten Sidoarjo" : selectedRegency === "35.78" ? "Kota Surabaya" : "semua wilayah"} tahun {history.year}.</span>}
          </div>

          {error && <p className="mt-8 rounded-2xl bg-red-100 p-5 text-sm text-red-800">{error}</p>}
          {history && history.total === 0 && (
            <div className="mt-8 rounded-[28px] bg-white p-8 text-slate-600">
              <p className="font-semibold text-[#123d61]">Riwayat banjir belum tersedia.</p>
              <p className="mt-2 text-sm leading-7">Belum ada kejadian DIBI BNPB yang diimpor ke database untuk dua wilayah ini. Tidak ada data dummy yang ditampilkan.</p>
            </div>
          )}

          {history && history.total > 0 && (
            <>
              <div className="mt-10 rounded-[32px] bg-[#123d61] p-6 text-white sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-sky-100/70">Kejadian per bulan</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#82d4d0]">Data DIBI BNPB</span>
                </div>
                <div className="mt-10 flex min-h-64 items-end gap-2 border-b border-white/15 sm:gap-4">
                  {history.monthly.map((item) => (
                    <motion.div key={item.month} initial={{ height: 0 }} animate={{ height: `${(item.count / maxMonthly) * 100}%` }} className="group relative min-h-2 flex-1 rounded-t-lg bg-[#82d4d0] hover:bg-[#f38a50]">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px]">{item.count}</span>
                      <span className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-sky-100/60">{monthLabel(item.month)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-10 overflow-hidden rounded-[28px] bg-white">
                <div className="grid grid-cols-[1fr_1fr_110px] gap-4 border-b border-slate-200 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Wilayah</span><span>Waktu kejadian</span><span>Status</span>
                </div>
                {history.events.slice(0, 20).map((event) => (
                  <div key={event.id} className="grid grid-cols-[1fr_1fr_110px] gap-4 border-b border-slate-100 px-6 py-4 text-sm last:border-0">
                    <span className="font-semibold text-[#123d61]">{event.area_name}<br /><small className="font-normal text-slate-500">{event.regency_name ?? event.regency_code}</small></span>
                    <span>{event.started_at ? new Date(event.started_at).toLocaleDateString("id-ID") : "Tanggal tidak tersedia"}</span>
                    <span className="text-slate-500">{event.verification_status}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="mt-6 text-xs text-slate-500">
            Sumber: <a className="underline" href={history?.source_url ?? "https://dibi.bnpb.go.id/"} target="_blank" rel="noreferrer">DIBI BNPB</a>.
            {history?.updated_at ? ` Pembaruan terakhir ${new Date(history.updated_at).toLocaleString("id-ID")}.` : " Data diperbarui setelah proses impor."}
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
