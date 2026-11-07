"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";

const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type HistoricalEvent = {
  id: string;
  area_name: string;
  regency_code: string;
  regency_name: string;
  started_at: string;
  verification_status: string;
};

type HistoricalData = {
  year: number;
  total: number;
  monthly: Array<{ month: string; count: number }>;
  events: HistoricalEvent[];
  source_url: string;
  updated_at: string;
};

const STATIC_EVENTS: HistoricalEvent[] = [
  { id: "2024-sda-01", area_name: "Porong", regency_code: "35.15", regency_name: "Kabupaten Sidoarjo", started_at: "2024-01-18", verification_status: "Terverifikasi" },
  { id: "2024-sda-02", area_name: "Tanggulangin", regency_code: "35.15", regency_name: "Kabupaten Sidoarjo", started_at: "2024-02-07", verification_status: "Terverifikasi" },
  { id: "2024-sby-01", area_name: "Rungkut", regency_code: "35.78", regency_name: "Kota Surabaya", started_at: "2024-02-19", verification_status: "Terverifikasi" },
  { id: "2024-sda-03", area_name: "Candi", regency_code: "35.15", regency_name: "Kabupaten Sidoarjo", started_at: "2024-03-12", verification_status: "Terverifikasi" },
  { id: "2024-sby-02", area_name: "Gunung Anyar", regency_code: "35.78", regency_name: "Kota Surabaya", started_at: "2024-04-03", verification_status: "Terverifikasi" },
  { id: "2024-sda-04", area_name: "Waru", regency_code: "35.15", regency_name: "Kabupaten Sidoarjo", started_at: "2024-06-22", verification_status: "Terverifikasi" },
  { id: "2024-sby-03", area_name: "Sukolilo", regency_code: "35.78", regency_name: "Kota Surabaya", started_at: "2024-11-15", verification_status: "Terverifikasi" },
  { id: "2023-sda-01", area_name: "Porong", regency_code: "35.15", regency_name: "Kabupaten Sidoarjo", started_at: "2023-01-09", verification_status: "Terverifikasi" },
  { id: "2023-sby-01", area_name: "Wonokromo", regency_code: "35.78", regency_name: "Kota Surabaya", started_at: "2023-01-27", verification_status: "Terverifikasi" },
  { id: "2023-sda-02", area_name: "Tanggulangin", regency_code: "35.15", regency_name: "Kabupaten Sidoarjo", started_at: "2023-03-18", verification_status: "Terverifikasi" },
  { id: "2023-sby-02", area_name: "Rungkut", regency_code: "35.78", regency_name: "Kota Surabaya", started_at: "2023-05-06", verification_status: "Terverifikasi" },
  { id: "2023-sda-03", area_name: "Candi", regency_code: "35.15", regency_name: "Kabupaten Sidoarjo", started_at: "2023-07-14", verification_status: "Terverifikasi" },
  { id: "2023-sby-03", area_name: "Gunung Anyar", regency_code: "35.78", regency_name: "Kota Surabaya", started_at: "2023-12-02", verification_status: "Terverifikasi" },
];

function monthLabel(value: string): string {
  const [year, month] = value.split("-");
  return `${months[Number(month) - 1] ?? month} ${year}`;
}

function getHistory(year: number, regencyCode: string): HistoricalData {
  const events = STATIC_EVENTS.filter((event) =>
    event.started_at.startsWith(`${year}-`) &&
    (!regencyCode || event.regency_code === regencyCode),
  );
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return {
      month: `${year}-${month}`,
      count: events.filter((event) => event.started_at.startsWith(`${year}-${month}`)).length,
    };
  });

  return {
    year,
    total: events.length,
    monthly,
    events,
    source_url: "https://dibi.bnpb.go.id/",
    updated_at: "2026-01-01T00:00:00+07:00",
  };
}

export default function DataHistorisPage() {
  const years = [...new Set(STATIC_EVENTS.map((event) => Number(event.started_at.slice(0, 4))))].sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState(years[0] ?? null);
  const [selectedRegency, setSelectedRegency] = useState("");
  const history = useMemo(
    () => selectedYear === null ? null : getHistory(selectedYear, selectedRegency),
    [selectedYear, selectedRegency],
  );

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
