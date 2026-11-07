"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Props = { wilayah: string };

type SourceDetail = {
  status: "available";
  provider: string;
  elevation_m?: number;
  river_distance_m?: number;
  fetched_at: string;
  method?: string;
  score?: number;
  environment_components?: {
    elevation_score: number;
    river_proximity_score: number;
  };
  drainage_components?: {
    physical_condition_score: number;
    capacity_score: number;
    coverage_score: number;
    maintenance_score: number;
    obstruction_score: number;
  };
};

type RiskExplanation = {
  caveat: string;
  completeness: "complete";
  confidence: "high";
  confidence_reasons: string[];
  sources: Record<string, SourceDetail>;
};

type RiskPrediction = {
  score: number;
  risk_level: "high" | "medium" | "low";
  explanation: RiskExplanation;
  rainfall_score: number;
  history_score: number;
  environment_score: number;
  drainage_score: number;
  data_as_of: string;
};

type StaticArea = {
  name: string;
  slug: string;
  prediction: RiskPrediction;
  rainfall: string;
  rainfallProbability: number;
  rainfallUpdatedAt: string;
};

function sourceStatus(explanation: RiskExplanation | null | undefined, key: string): string {
  return explanation?.sources?.[key]?.status === "available" ? "Tersedia" : "Belum tersedia";
}

const STATIC_AREAS: Record<string, StaticArea> = {
  surabaya: {
    name: "Surabaya",
    slug: "surabaya",
    rainfall: "28",
    rainfallProbability: 70,
    rainfallUpdatedAt: "2026-11-07T16:00:00+07:00",
    prediction: {
      score: 68,
      risk_level: "medium",
      rainfall_score: 70,
      history_score: 62,
      environment_score: 58,
      drainage_score: 64,
      data_as_of: "2026-11-07T16:00:00+07:00",
      explanation: {
        caveat: "Data contoh statis untuk demonstrasi SIGAB, bukan prakiraan resmi.",
        completeness: "complete",
        confidence: "high",
        confidence_reasons: ["Data wilayah tersedia", "Parameter risiko telah diisi"],
        sources: {
          rainfall: { status: "available", provider: "BMKG", fetched_at: "2026-11-07T16:00:00+07:00" },
          history: { status: "available", provider: "DIBI BNPB", fetched_at: "2026-01-01T00:00:00+07:00" },
          environment: { status: "available", provider: "Data lingkungan statis", elevation_m: 5, river_distance_m: 1200, fetched_at: "2026-01-01T00:00:00+07:00", environment_components: { elevation_score: 52, river_proximity_score: 64 } },
          drainage: { status: "available", provider: "Data drainase statis", fetched_at: "2026-01-01T00:00:00+07:00", method: "static_reference", drainage_components: { physical_condition_score: 65, capacity_score: 62, coverage_score: 68, maintenance_score: 60, obstruction_score: 64 } },
        },
      },
    },
  },
};

function formatRelativeTime(value: string): string {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 1) return "Baru saja";
  if (elapsedMinutes === 1) return "1 menit yang lalu";
  if (elapsedMinutes < 60) return `${elapsedMinutes} menit yang lalu`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours === 1) return "1 jam yang lalu";
  if (elapsedHours < 24) return `${elapsedHours} jam yang lalu`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return elapsedDays === 1 ? "1 hari yang lalu" : `${elapsedDays} hari yang lalu`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function WilayahView({ wilayah }: Props) {
  const fallbackArea = STATIC_AREAS.surabaya;
  const area = STATIC_AREAS[wilayah] ?? {
    ...fallbackArea,
    name: wilayah.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    slug: wilayah,
  };
  const prediction = area.prediction;
  const rainfall = area.rainfall;
  const rainfallProbability = area.rainfallProbability;
  const rainfallUpdatedAt = area.rainfallUpdatedAt;

  const title = area.name;
  const score = prediction.score;
  const riskLabel = prediction.risk_level === "high" ? "Tinggi" : prediction.risk_level === "medium" ? "Sedang" : "Rendah";
  const explanation = prediction.explanation;
  const environmentSource = explanation?.sources?.environment;
  const environmentComponents = environmentSource?.environment_components;
  const drainageSource = explanation?.sources?.drainage;
  const rainfallScore = Number(prediction.rainfall_score);
  const environmentScore = Number(prediction.environment_score);
  const drainageScore = Number(prediction.drainage_score);
  const drainageIsUnmapped = drainageScore === null
    && drainageSource?.method === "nearest_mapped_drainage_quality_proxy"
    && drainageSource?.score === 0;
  const drainageLabel = drainageScore === null
    ? drainageIsUnmapped ? "Tidak terpetakan" : "Belum tersedia"
    : drainageScore === 0 && drainageSource?.method === "nearest_mapped_drainage_quality_proxy"
      ? "Tidak terpetakan dekat"
    : drainageScore >= 67 ? "Baik" : drainageScore >= 34 ? "Perlu perhatian" : "Kurang baik";
  const probabilityLabel = rainfallProbability == null
    ? "Peluang belum tersedia"
    : `${String(rainfallProbability).replace("%", "")}%`;
  const probabilityWidth = Number.parseFloat(String(rainfallProbability ?? 0)) || 0;
  const updatedLabel = rainfallUpdatedAt
    ? formatRelativeTime(rainfallUpdatedAt)
    : "Waktu belum tersedia";
  const updatedDateTime = rainfallUpdatedAt
    ? formatDateTime(rainfallUpdatedAt)
    : "Tanggal dan waktu belum tersedia";
  const factors = [
    { label: "Hujan BMKG", value: rainfall === null ? "Belum tersedia" : `${probabilityLabel} · skor ${rainfallScore ?? "—"}/100`, width: `${Math.min(100, Math.max(0, rainfallScore ?? 0))}%` },
    { label: "Riwayat banjir", value: prediction?.history_score === null || prediction?.history_score === undefined ? "Belum tersedia" : `${prediction.history_score}`, width: `${prediction?.history_score ?? 0}%` },
    { label: "Faktor lingkungan", value: environmentScore === null ? "Belum tersedia" : `${environmentScore}/100`, width: `${environmentScore ?? 0}%` },
    { label: "Kondisi drainase", value: drainageScore === null ? "Belum tersedia" : `${drainageScore}/100 · ${drainageLabel}`, width: `${drainageScore ?? 0}%` },
  ];

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <section className="bg-[#123d61] px-6 pb-16 pt-32 text-white">
        <div className="mx-auto max-w-[1180px]">
          <Link href="/peta-risiko" className="text-sm text-sky-100/70 transition hover:text-white">← Kembali ke peta risiko</Link>
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Detail wilayah</p>
          <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><h1 className="text-5xl font-semibold tracking-[-0.08em] sm:text-7xl">{title}</h1><p className="mt-4 max-w-xl text-base leading-8 text-sky-100/75">Gambaran kondisi, faktor risiko, dan sumber data wilayah ini.</p></div>
            <span className="w-fit rounded-full bg-[#f38a50] px-4 py-2 text-sm font-bold text-[#123d61]">{riskLabel}</span>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Skor risiko", score === null ? "—" : String(score), "dari 100"],
              ["Peluang hujan BMKG", rainfallProbability == null ? "—" : `${String(rainfallProbability).replace("%", "")}%`, rainfall == null ? `Skor hujan: ${rainfallScore ?? "—"}/100` : `${rainfall} mm · skor hujan ${rainfallScore ?? "—"}/100`],
              ["Pembaruan", updatedLabel, `${updatedDateTime} · refresh otomatis setiap 5 menit`],
            ].map(([label, value, suffix], index) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`${index === 0 ? "bg-[#f38a50] text-[#123d61]" : "bg-white"} rounded-[28px] p-7`}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{label}</p><p className="mt-6 text-5xl font-semibold tracking-[-0.08em]">{value}</p><p className="mt-2 text-sm opacity-70">{suffix}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.75fr]">
            <div className="rounded-[30px] bg-[#26669a] p-8 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#82d4d0]">Faktor yang memengaruhi</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em]">Kenapa skor ini muncul?</h2>
              <div className="mt-8 space-y-6">{factors.map((factor) => <div key={factor.label}><div className="flex justify-between text-sm"><span>{factor.label}</span><span className="text-right text-[#82d4d0]">{factor.value}</span></div><div className="mt-2 h-2 rounded-full bg-white/15"><motion.div initial={{ width: 0 }} animate={{ width: factor.width }} transition={{ duration: 0.8 }} className="h-2 rounded-full bg-[#f38a50]" /></div></div>)}</div>
              <div className="mt-6 space-y-2 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-sky-100/80">
                <p>BMKG memperkirakan peluang hujan {probabilityLabel} pada slot waktu terbaru, dengan jumlah sekitar {rainfall ?? "—"} mm. Skor hujan untuk perhitungan risiko: {rainfallScore ?? "—"}/100.</p>
                <p>Skor lingkungan menggabungkan elevasi {environmentComponents?.elevation_score ?? "—"} dan kedekatan sungai {environmentComponents?.river_proximity_score ?? "—"}.</p>
                {drainageScore !== null
                  ? <p>Skor kualitas drainase {drainageScore}/100: {drainageLabel}. Semakin tinggi skor, semakin baik ketersediaan atau kondisi drainase. Nilai ini membantu menurunkan skor risiko.{drainageSource?.method === "nearest_mapped_drainage_quality_proxy" && " Data ini adalah proxy kedekatan jaringan OSM, bukan pemeriksaan fisik."}</p>
                  : drainageIsUnmapped && <p>Drainase tidak terpetakan dekat. Nilai 0 tidak dimasukkan ke perhitungan skor risiko karena bukan bukti drainase rusak.</p>}
                {drainageSource?.drainage_components && <p>Rincian kualitas: kondisi fisik {drainageSource.drainage_components.physical_condition_score}, kapasitas {drainageSource.drainage_components.capacity_score}, cakupan {drainageSource.drainage_components.coverage_score}, pemeliharaan {drainageSource.drainage_components.maintenance_score}, dan sumbatan {drainageSource.drainage_components.obstruction_score}.</p>}
                {environmentSource?.river_distance_m != null && <p>Jarak centroid wilayah ke sungai terdekat: {environmentSource.river_distance_m} m. Nilai ini adalah proxy, bukan kepastian banjir.</p>}
              </div>
            </div>
            <div className="rounded-[30px] bg-[#f0e7e2] p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f38a50]">Cuaca BMKG</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Informasi prakiraan</h2><p className="mt-4 text-sm leading-7 text-slate-600">Peluang hujan {probabilityLabel}, dengan prakiraan jumlah {rainfall ?? "—"} mm pada slot waktu ini.</p><p className="mt-4 text-xs leading-5 text-slate-500">Data BMKG adalah prakiraan per slot waktu, bukan observasi hujan aktual. Halaman ini mengambil data terbaru otomatis setiap 5 menit. Nilai peluang dapat belum tersedia bila BMKG tidak mengirimkan data persentasenya.</p></div>
          </div>

          <div className="mt-8 rounded-[30px] bg-white p-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#26669a]">Transparansi perhitungan</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Sumber informasi wilayah</h2></div><span className="w-fit rounded-full bg-[#f0e7e2] px-3 py-1 text-xs font-bold text-[#123d61]">{explanation?.completeness === "complete" ? "Data lengkap" : explanation?.completeness === "partial" ? "Data sebagian" : "Data terbatas"}</span></div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{explanation?.caveat ?? "Belum ada penjelasan sumber untuk prediksi ini."}</p>
            <p className="mt-2 text-xs text-slate-500">Confidence: {explanation?.confidence ?? "limited"}{explanation?.confidence_reasons?.length ? ` — ${explanation.confidence_reasons.join(", ")}` : ""}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-4">{[["rainfall", "Cuaca dan curah hujan"], ["history", "Riwayat banjir"], ["environment", "Faktor lingkungan"], ["drainage", "Kondisi drainase"]].map(([key, label]) => { const detail = explanation?.sources?.[key]; return <div key={key} className="rounded-2xl bg-[#dfeaf0] p-4"><p className="text-sm font-semibold text-[#123d61]">{label}</p><p className="mt-2 text-xs text-slate-600">{sourceStatus(explanation, key)}{detail?.provider ? ` dari ${detail.provider}` : ""}</p>{detail?.elevation_m != null && <p className="mt-1 text-xs text-slate-500">Elevasi: {detail.elevation_m} m</p>}{detail?.river_distance_m != null && <p className="mt-1 text-xs text-slate-500">Jarak sungai: {detail.river_distance_m} m</p>}{detail?.fetched_at && <p className="mt-1 text-xs text-slate-500">Diambil: {new Date(detail.fetched_at).toLocaleString("id-ID")}</p>}</div>; })}</div>
          </div>

          <div className="mt-8 rounded-[30px] bg-[#f0e7e2] p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f38a50]">Saran singkat</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Siapkan lebih awal.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Letakkan barang penting di tempat tinggi, pantau informasi resmi, dan kenali jalur menuju tempat aman.</p><Link href="/mitigasi" className="mt-8 inline-flex rounded-full bg-[#123d61] px-5 py-3 text-sm font-bold text-white">Baca panduan mitigasi</Link></div>
        </div>
      </section>
      <section className="bg-[#f0e7e2] px-6 py-16"><div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Lanjutkan eksplorasi</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Lihat riwayat wilayah ini.</h2></div><Link href="/data-historis" className="rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white">Data Historis ↗</Link></div></section>
    </main>
  );
}
