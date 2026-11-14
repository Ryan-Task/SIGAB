"use client";

import { useEffect, useState } from "react";
import AdminNav from "../AdminNav";
import { getAdminDashboard, getCurrentUser, getFloodEventYears, getFloodHistoryByYear, getHistorySummary, importAdminHistory, type AdminDashboard, type ApiFloodHistory, type ApiHistorySummary } from "../../../lib/api";

const items: Array<{ key: keyof AdminDashboard; title: string; description: string }> = [
  { key: "users", title: "Pengguna terdaftar", description: "Jumlah akun pengguna yang tercatat." },
  { key: "areas", title: "Wilayah aktif", description: "Wilayah yang tersedia untuk pemantauan risiko banjir." },
  { key: "saved_locations", title: "Daerah pantauan", description: "Lokasi pantauan yang disimpan pengguna." },
  { key: "push_subscriptions", title: "Subscription notifikasi", description: "Perangkat yang terhubung untuk menerima peringatan." },
  { key: "risk_predictions", title: "Data risiko banjir", description: "Prediksi risiko yang tersedia di sistem." },
];

export default function AdminHistoryPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [message, setMessage] = useState("Memuat ringkasan riwayat...");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<ApiHistorySummary | null>(null);
  const [floodHistory, setFloodHistory] = useState<ApiFloodHistory | null>(null);
  const [floodYears, setFloodYears] = useState<number[]>([]);
  const [selectedFloodYear, setSelectedFloodYear] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user?.is_admin) {
        window.location.replace("/");
        return;
      }
      Promise.all([getAdminDashboard(), getHistorySummary(), getFloodEventYears()])
        .then(async ([dashboard, history, years]) => {
          setData(dashboard);
          setSummary(history);
          setFloodYears(years);
          const year = years[0] ?? null;
          setSelectedFloodYear(year);
          if (year !== null) setFloodHistory(await getFloodHistoryByYear(year));
        })
        .catch(() => setMessage("Riwayat belum dapat dimuat."));
    });
  }, []);

  useEffect(() => {
    if (selectedFloodYear === null) return;
    getFloodHistoryByYear(selectedFloodYear).then(setFloodHistory).catch(() => setFloodHistory(null));
  }, [selectedFloodYear]);

  async function uploadHistory(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("Pilih file CSV riwayat terlebih dahulu.");
      return;
    }
    setUploading(true);
    try {
      setMessage(await importAdminHistory(file));
      setFile(null);
      const input = document.getElementById("admin-history-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setData(await getAdminDashboard());
      setSummary(await getHistorySummary());
      const years = await getFloodEventYears();
      setFloodYears(years);
      setSelectedFloodYear((current) => current ?? years[0] ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "CSV riwayat belum dapat diimpor.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <AdminNav />
      <section className="mx-auto min-h-screen max-w-5xl px-5 pb-24 pt-32 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#26669a]">Aktivitas sistem</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61] sm:text-6xl">Riwayat</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Ringkasan data yang saat ini tersimpan dan dikelola oleh sistem SIGAB.</p>
        <section className="mt-8 rounded-[28px] bg-[#123d61] p-6 text-white shadow-[0_20px_45px_rgba(18,61,97,0.16)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#82d4d0]">Import data historis</p>
          <h2 className="mt-2 text-2xl font-semibold">Tambahkan CSV riwayat banjir</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100/75">
            Gunakan CSV dengan kolom wajib <span className="font-semibold text-white">event_id, event_date, location, source_url</span>. Data lama dari sumber riwayat akan diganti dengan data CSV terbaru.
          </p>
          <p className="mt-3 text-xs font-semibold text-[#82d4d0]">Peringatan: nama file akan diproses sebagai bpbd-banjir-histori.csv.</p>
          <form onSubmit={uploadHistory} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="admin-history-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm text-white file:mr-3 file:rounded-full file:border-0 file:bg-[#82d4d0] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#123d61] sm:max-w-md"
            />
            <button disabled={uploading || !file} className="rounded-full bg-[#f38a50] px-5 py-3 text-sm font-bold text-[#123d61] transition hover:bg-[#ffb17e] disabled:opacity-50">
              {uploading ? "Mengimpor..." : "Import CSV"}
            </button>
          </form>
        </section>
        {data ? (
          <>
          <div className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-[0_20px_45px_rgba(38,102,154,0.1)]">
            {items.map((item, index) => (
              <article key={item.key} className={`flex flex-col gap-4 p-6 transition hover:bg-[#f4f8fa] sm:flex-row sm:items-center sm:justify-between sm:p-7 ${index > 0 ? "border-t border-slate-100" : ""}`}>
                <div>
                  <p className="font-semibold text-[#123d61]">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
                <p className="text-3xl font-semibold tracking-[-0.05em] text-[#26669a]">{data[item.key]}</p>
              </article>
            ))}
          </div>
          {summary && (
            <section className="mt-8 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <article className="rounded-[28px] bg-[#123d61] p-6 text-white shadow-[0_20px_45px_rgba(18,61,97,0.14)]">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Curah hujan per hari</h2>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#82d4d0]">Historis</span>
                  </div>
                  <div className="mt-8 flex min-h-56 items-end gap-2 border-b border-white/15">
                    {summary.rainfall.daily.map((item) => {
                      const max = Math.max(...summary.rainfall.daily.map((entry) => entry.total_mm), 1);
                      return <div key={item.day} className="group relative flex-1">
                        <div className="rounded-t bg-[#82d4d0] transition group-hover:bg-[#f38a50]" style={{ height: `${Math.max((item.total_mm / max) * 190, 3)}px` }} title={`${item.total_mm} mm`} />
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-sky-100/65">{item.day.slice(5)}</span>
                      </div>;
                    })}
                  </div>
                </article>
                <article className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(38,102,154,0.08)]">
                  <h2 className="font-semibold text-[#123d61]">Pola hujan 24 jam</h2>
                  <p className="mt-1 text-xs text-slate-500">Rata-rata curah hujan per jam</p>
                  <div className="mt-8 flex min-h-56 items-end gap-1 border-b border-slate-200">
                    {summary.rainfall.hourly.map((item) => {
                      const max = Math.max(...summary.rainfall.hourly.map((entry) => entry.avg_mm), 1);
                      return <div key={item.hour} className="group relative flex-1">
                        <div className="rounded-t bg-[#26669a] transition group-hover:bg-[#f38a50]" style={{ height: `${Math.max((item.avg_mm / max) * 190, 3)}px` }} title={`${String(item.hour).padStart(2, "0")}:00: ${item.avg_mm} mm`} />
                        {item.hour % 6 === 0 && <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-400">{String(item.hour).padStart(2, "0")}</span>}
                      </div>;
                    })}
                  </div>
                </article>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <article className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(38,102,154,0.08)]">
                  <h2 className="font-semibold text-[#123d61]">Sebaran skor risiko banjir</h2>
                  <p className="mt-1 text-xs text-slate-500">Jumlah wilayah per rentang skor 0 sampai 100</p>
                  <div className="mt-8 flex min-h-52 items-end gap-2 border-b border-slate-200">
                    {summary.risk.score_distribution.map((item) => {
                      const max = Math.max(...summary.risk.score_distribution.map((entry) => entry.count), 1);
                      return <div key={item.bucket} className="relative flex-1">
                        <div className="rounded-t bg-[#f38a50] transition hover:bg-[#123d61]" style={{ height: `${Math.max((item.count / max) * 180, 3)}px` }} title={`${item.count} wilayah`} />
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-slate-400">{item.bucket}</span>
                      </div>;
                    })}
                  </div>
                </article>
                <article className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(38,102,154,0.08)]">
                  <h2 className="font-semibold text-[#123d61]">Komponen skor risiko banjir</h2>
                  <p className="mt-1 text-xs text-slate-500">Rata-rata kontribusi komponen model</p>
                  <div className="mt-7 space-y-5">
                    {summary.risk.components.map((component) => (
                      <div key={component.key}>
                        <div className="flex justify-between text-sm"><span className="text-[#123d61]">{component.label}</span><span className="text-slate-500">{component.avg}</span></div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#26669a]" style={{ width: `${component.avg}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
              <article className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(38,102,154,0.08)]">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div><h2 className="font-semibold text-[#123d61]">Riwayat kejadian banjir</h2><p className="mt-1 text-xs text-slate-500">Jumlah kejadian per bulan dari CSV yang diimpor.</p></div>
                  <select value={selectedFloodYear ?? ""} onChange={(event) => setSelectedFloodYear(Number(event.target.value))} className="rounded-full border border-[#26669a]/25 px-4 py-2 text-sm text-[#123d61]">
                    {floodYears.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                {floodHistory && <div className="mt-8 flex min-h-56 items-end gap-2 border-b border-slate-200">
                  {Array.from({ length: 12 }, (_, index) => {
                    const month = String(index + 1).padStart(2, "0");
                    const item = floodHistory.monthly.find((entry) => entry.month.endsWith(`-${month}`));
                    const count = item?.count ?? 0;
                    const max = Math.max(...floodHistory.monthly.map((entry) => entry.count), 1);
                    return <div key={month} className="group relative flex-1"><div className="rounded-t bg-[#f38a50] transition group-hover:bg-[#123d61]" style={{ height: `${Math.max((count / max) * 190, count > 0 ? 8 : 2)}px` }} title={`${count} kejadian`} /><span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-400">{month}</span></div>;
                  })}
                </div>}
              </article>
            </section>
          )}
          </>
        ) : <p className="mt-8 rounded-2xl bg-white p-5 text-sm text-slate-600">{message}</p>}
      </section>
    </main>
  );
}
