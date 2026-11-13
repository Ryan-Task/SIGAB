"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { discoverEnvironmentData, getAreaCurrentWeather, getAreaRainfall, getCachedAreaRisk, type ApiArea, type ApiCurrentWeather, type ApiEnvironmentDiscovery, type ApiRainfallRecord, type ApiRiskExplanation, type ApiRiskPrediction } from "../../../lib/api";

export type WilayahInitialData = {
  risk: { area: ApiArea; prediction: ApiRiskPrediction | null } | null;
  rainfall: ApiRainfallRecord[] | null;
  weather: ApiCurrentWeather | null;
};

type Props = { wilayah: string; initial?: WilayahInitialData | null };

function sourceStatus(explanation: ApiRiskExplanation | null | undefined, key: string): string {
  return explanation?.sources?.[key]?.status === "available" ? "Tersedia" : "Belum tersedia";
}

function formatRelativeTime(value: string, now: number): string {
  const elapsedMinutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60_000));
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

export default function WilayahView({ wilayah, initial }: Props) {
  const [area, setArea] = useState<{ name: string; slug: string } | null>(initial?.risk?.area ?? null);
  const [prediction, setPrediction] = useState<ApiRiskPrediction | null>(initial?.risk?.prediction ?? null);
  const [rainfall, setRainfall] = useState<string | null>(initial?.rainfall?.[0]?.rainfall_mm ?? null);
  const [rainfallProbability, setRainfallProbability] = useState<number | string | null>(initial?.rainfall?.[0]?.rainfall_probability ?? null);
  const [weatherDescription, setWeatherDescription] = useState<string | null>(initial?.rainfall?.[0]?.weather_description ?? null);
  const [rainfallForecast, setRainfallForecast] = useState<ApiRainfallRecord[]>(initial?.rainfall ?? []);
  const [forecastIndex, setForecastIndex] = useState(0);
  const [currentWeather, setCurrentWeather] = useState<ApiCurrentWeather | null>(initial?.weather ?? null);
  const [rainfallUpdatedAt, setRainfallUpdatedAt] = useState<string | null>(
    initial?.risk?.prediction?.explanation?.sources?.rainfall?.fetched_at
      ?? initial?.risk?.prediction?.calculated_at
      ?? initial?.rainfall?.[0]?.fetched_at
      ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [discovery, setDiscovery] = useState<ApiEnvironmentDiscovery | null>(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryCooldown, setDiscoveryCooldown] = useState(false);
  const forecastTouchStart = useRef<number | null>(null);
  // Date.now() must not run during server prerender; set it after hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  useEffect(() => {
    // Each payload renders as soon as it arrives: the risk score must not wait
    // for the weather provider, and a failing optional feed must not blank the page.
    const load = () => {
      getCachedAreaRisk(wilayah)
        .then((risk) => {
          setError(null);
          setArea(risk.area);
          setPrediction(risk.prediction);
          const rainfallFetchedAt = risk.prediction?.explanation?.sources?.rainfall?.fetched_at;
          setRainfallUpdatedAt(rainfallFetchedAt ?? risk.prediction?.calculated_at ?? null);
        })
        .catch(() => setError("Data wilayah belum dapat dimuat. Pastikan server Laravel aktif."));

      getAreaRainfall(wilayah)
        .then((rainfallResponse) => {
          setRainfall(rainfallResponse.data[0]?.rainfall_mm ?? null);
          setRainfallProbability(rainfallResponse.data[0]?.rainfall_probability ?? null);
          setWeatherDescription(rainfallResponse.data[0]?.weather_description ?? null);
          setRainfallForecast(rainfallResponse.data);
          setForecastIndex((currentIndex) => Math.min(currentIndex, Math.max(0, rainfallResponse.data.length - 1)));
          setRainfallUpdatedAt((current) => current ?? rainfallResponse.data[0]?.fetched_at ?? null);
        })
        .catch(() => undefined);

      getAreaCurrentWeather(wilayah)
        .then(setCurrentWeather)
        .catch(() => undefined);
    };
    // Server-prefetched data renders immediately; only fetch on mount when the
        // initial payload is missing (e.g. a failed prefetch).
        if (!initial) load();
        const refresh = window.setInterval(load, 60_000);
        return () => window.clearInterval(refresh);
      }, [wilayah, initial]);

  const title = area?.name ?? wilayah.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const score = prediction?.score ?? null;
  const riskLabel = prediction?.risk_level === "high" ? "Tinggi" : prediction?.risk_level === "medium" ? "Sedang" : prediction?.risk_level === "low" ? "Rendah" : "Data belum cukup";
  const explanation = prediction?.explanation;
  const environmentSource = explanation?.sources?.environment;
  const environmentComponents = environmentSource?.environment_components;
  const drainageSource = explanation?.sources?.drainage;
  const rainfallScore = prediction?.rainfall_score == null ? null : Number(prediction.rainfall_score);
  const environmentScore = prediction?.environment_score == null ? null : Number(prediction.environment_score);
  const drainageScore = prediction?.drainage_score == null ? null : Number(prediction.drainage_score);
  const drainageIsUnmapped = drainageScore === null
    && drainageSource?.method === "nearest_mapped_drainage_quality_proxy"
    && drainageSource?.score === 0;
  const drainageLabel = drainageScore === null
    ? drainageIsUnmapped ? "Tidak terpetakan" : "Belum tersedia"
    : drainageScore === 0 && drainageSource?.method === "nearest_mapped_drainage_quality_proxy"
      ? "Tidak terpetakan dekat"
    : drainageScore >= 67 ? "Baik" : drainageScore >= 34 ? "Perlu perhatian" : "Kurang baik";
  const hasRainIndication = (Number.parseFloat(String(rainfall ?? 0)) > 0)
    || /hujan|gerimis|shower|rain/i.test(weatherDescription ?? "");
  const probabilityLabel = rainfallProbability == null
    ? hasRainIndication ? "Perkiraan akan hujan" : "Tidak ada perkiraan hujan"
    : `${String(rainfallProbability).replace("%", "")}%`;
  const rainfallAmount = rainfall === null ? null : Number.parseFloat(rainfall);
  const rainfallIntensityLabel = rainfallAmount === null || rainfallAmount === 0
    ? "Tidak ada hujan"
    : rainfallAmount < 1 ? "Hujan sangat ringan"
      : rainfallAmount < 5 ? "Hujan ringan"
        : rainfallAmount < 10 ? "Hujan sedang"
          : rainfallAmount < 20 ? "Hujan deras"
            : "Hujan sangat deras";
  const bmkgConditionLabel = weatherDescription
    ? weatherDescription
    : hasRainIndication ? "Hujan diprakirakan" : "Tidak ada hujan diprakirakan";
  const currentRainLabel = currentWeather?.current.is_raining ? "Sedang hujan" : "Tidak sedang hujan";
  const currentRainScore = prediction?.current_weather_score ?? currentWeather?.current.rain_score ?? 0;
  const currentRainDurationLabel = currentWeather?.rain_window.start_at && currentWeather.rain_window.end_at
    ? `${formatDateTime(currentWeather.rain_window.start_at)}–${formatDateTime(currentWeather.rain_window.end_at)} (${currentWeather.rain_window.duration_hours} jam)`
    : "Tidak ada hujan terdeteksi saat ini";
  const probabilityWidth = Number.parseFloat(String(rainfallProbability ?? 0)) || 0;
  const updatedLabel = rainfallUpdatedAt && now != null
      ? formatRelativeTime(rainfallUpdatedAt, now)
      : rainfallUpdatedAt
        ? formatDateTime(rainfallUpdatedAt)
        : "Waktu belum tersedia";
    const isStale = rainfallUpdatedAt && now != null
      ? now - new Date(rainfallUpdatedAt).getTime() > 30 * 60_000
      : false;
  const updatedDateTime = rainfallUpdatedAt
    ? formatDateTime(rainfallUpdatedAt)
    : "Tanggal dan waktu belum tersedia";
  const historyCount = prediction?.history_count ?? null;
  const historyFrequency = prediction?.history_frequency;
  const historyLabel = historyCount === null
    ? "Tidak ada / belum ada data"
    : `${historyCount} kejadian · ${historyFrequency === "sering" ? "Sering" : historyFrequency === "terkadang" ? "Terkadang" : "Jarang"}`;
  const historyWidth = historyFrequency === "sering" ? "100%" : historyFrequency === "terkadang" ? "60%" : historyFrequency === "jarang" ? "20%" : "0%";
  const factors = [
    { label: "Hujan saat ini", value: `${currentRainLabel} · skor ${currentRainScore}/100`, width: `${currentRainScore}%` },
    { label: "Riwayat banjir", value: historyLabel, width: historyWidth },
    { label: "Faktor lingkungan", value: environmentScore === null ? "Belum tersedia" : `${environmentScore}/100`, width: `${environmentScore ?? 0}%` },
    { label: "Kondisi drainase", value: drainageScore === null ? "Belum tersedia" : `${drainageScore}/100 · ${drainageLabel}`, width: `${drainageScore ?? 0}%` },
  ];
  const formatForecastDay = (value: string): string => new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
  const formatForecastTime = (value: string): string => new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
  const forecastCondition = (record: ApiRainfallRecord): string => {
    if (record.weather_description) return record.weather_description;
    const amount = Number.parseFloat(String(record.rainfall_mm ?? 0));
    return amount > 0 ? "Perkiraan hujan" : "Tidak ada hujan";
  };
  const forecastAmount = (record: ApiRainfallRecord): string => {
    if (record.rainfall_mm === null) return "— mm";
    return `${record.rainfall_mm} mm`;
  };
  const forecastIcon = (record: ApiRainfallRecord) => {
    const condition = forecastCondition(record).toLowerCase();
    if (/hujan|gerimis|shower|rain/.test(condition)) {
      return <span aria-label="Hujan" className="text-4xl">🌧️</span>;
    }
    if (/kabut|fog/.test(condition)) {
      return <span aria-label="Berkabut" className="text-4xl">🌫️</span>;
    }
    if (/cerah berawan|berawan|cloud/.test(condition)) {
      return <span aria-label="Berawan" className="text-4xl">🌤️</span>;
    }
    return <span aria-label="Cerah" className="text-4xl">☀️</span>;
  };
  const selectedForecast = rainfallForecast[forecastIndex] ?? null;
  const formatEnvironmentalScore = (value: number | null | undefined): string => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
    return Number(value).toFixed(2).replace(/\.?0+$/, "");
  };
  const runDiscovery = () => {
    if (discoveryLoading || discoveryCooldown) return;
    setDiscoveryLoading(true);
    setDiscoveryError(null);
    discoverEnvironmentData(wilayah)
      .then(setDiscovery)
      .catch((error: unknown) => setDiscoveryError(error instanceof Error ? error.message : "Pencarian sumber data belum berhasil."))
      .finally(() => {
        setDiscoveryLoading(false);
        setDiscoveryCooldown(true);
        window.setTimeout(() => setDiscoveryCooldown(false), 30_000);
      });
  };

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
          {error && <p className="mt-5 text-sm text-sky-100/75">{error}</p>}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-5 md:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-[#f38a50] p-7 text-[#123d61]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Skor risiko banjir</p>
              <p className="mt-6 text-5xl font-semibold tracking-[-0.08em]">{score === null ? "—" : score}</p>
              <p className="mt-2 text-sm opacity-70">dari 100</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-white p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Prakiraan hujan BMKG</p>
                <span className="text-xs text-slate-400">{rainfallForecast.length > 0 ? `${forecastIndex + 1}/${rainfallForecast.length}` : "—"}</span>
              </div>
              {selectedForecast ? (
                <div
                  className="mt-5 touch-pan-y select-none text-center"
                  onPointerDown={(event) => { forecastTouchStart.current = event.clientX; }}
                  onPointerUp={(event) => {
                    const start = forecastTouchStart.current;
                    forecastTouchStart.current = null;
                    if (start === null || Math.abs(event.clientX - start) < 40) return;
                    setForecastIndex((index) => event.clientX < start
                      ? Math.min(rainfallForecast.length - 1, index + 1)
                      : Math.max(0, index - 1));
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      aria-label="Prakiraan sebelumnya"
                      disabled={forecastIndex === 0}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => setForecastIndex((index) => Math.max(0, index - 1))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#26669a]/30 bg-[#26669a]/10 text-2xl font-semibold text-[#26669a] transition hover:bg-[#26669a] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      ←
                    </button>
                    <div>
                      <p className="text-sm font-bold text-[#26669a]">{formatForecastDay(selectedForecast.observed_at)}</p>
                      <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">{formatForecastTime(selectedForecast.observed_at)}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Prakiraan berikutnya"
                      disabled={forecastIndex === rainfallForecast.length - 1}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => setForecastIndex((index) => Math.min(rainfallForecast.length - 1, index + 1))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#26669a]/30 bg-[#26669a]/10 text-2xl font-semibold text-[#26669a] transition hover:bg-[#26669a] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      →
                    </button>
                  </div>
                  <div className="mt-3">{forecastIcon(selectedForecast)}</div>
                  <p className="mt-2 text-sm font-medium text-slate-700">{forecastCondition(selectedForecast)}</p>
                  <p className="mt-1 text-sm text-slate-500">{forecastAmount(selectedForecast)} · {selectedForecast.rainfall_probability == null ? "Peluang —" : `Peluang ${selectedForecast.rainfall_probability}%`}</p>
                  <p className="mt-3 text-xs text-slate-400">Geser untuk melihat waktu berikutnya</p>
                </div>
              ) : <p className="mt-6 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Belum tersedia</p>}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-white p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Kondisi saat ini</p>
              <p className="mt-6 text-5xl font-semibold tracking-[-0.08em]">{currentRainLabel}</p>
              <p className="mt-2 text-sm opacity-70">{currentRainDurationLabel} · diperbarui {currentWeather && now != null ? formatRelativeTime(currentWeather.fetched_at, now) : "—"}</p>
            </motion.div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.75fr]">
            <div className="rounded-[30px] bg-[#26669a] p-8 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#82d4d0]">Faktor yang memengaruhi</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em]">Kenapa skor ini muncul?</h2>
              <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-sky-100/85">
                Faktor lingkungan adalah perkiraan kerentanan wilayah berdasarkan kondisi geografis, bukan kondisi hujan saat ini.
                Skor ini memakai elevasi dan kedekatan dengan sungai. Semakin tinggi skornya, semakin besar kontribusinya terhadap risiko banjir.
                Nilai ini merupakan proxy dan bukan kepastian banjir.
              </p>
              <div className="mt-8 space-y-6">{factors.map((factor) => <div key={factor.label}><div className="flex justify-between text-sm"><span>{factor.label}</span><span className="text-right text-[#82d4d0]">{factor.value}</span></div><div className="mt-2 h-2 rounded-full bg-white/15"><motion.div initial={{ width: 0 }} animate={{ width: factor.width }} transition={{ duration: 0.8 }} className="h-2 rounded-full bg-[#f38a50]" /></div></div>)}</div>
              <div className="mt-6 space-y-2 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-sky-100/80">
                <p><strong>Kondisi saat ini ({currentWeather?.provider ?? "Open-Meteo"}):</strong> {currentRainLabel.toLowerCase()}. Skor hujan saat ini: {currentRainScore}/100. Jika tidak sedang hujan, skor otomatis 0; jika hujan, skor mengikuti intensitas dan durasinya. Durasi: {currentRainDurationLabel}. Nilai ini sekarang ikut langsung dalam skor risiko real-time.</p>
                <p><strong>BMKG:</strong> ini adalah prakiraan untuk slot waktu BMKG terdekat. Interval 3 jam berarti satu data BMKG mewakili perkiraan pada rentang waktu 3 jam, bukan hujan berlangsung terus selama 3 jam. Kondisinya {bmkgConditionLabel.toLowerCase()} dengan {probabilityLabel.toLowerCase()} dan perkiraan sekitar {rainfall ?? "—"} mm. Komponen hujan yang saat ini masuk ke skor risiko berasal dari prakiraan BMKG ini.</p>
                <p>Dalam 12 bulan terakhir tercatat {historyLabel.toLowerCase()}. Lebih dari 5 kejadian dikategorikan sering, 2–5 terkadang, dan 1 jarang. Jika tidak ada data, histori tidak dimasukkan ke perhitungan.</p>
                <p>Faktor lingkungan: elevasi {formatEnvironmentalScore(environmentComponents?.elevation_score)} dan kedekatan sungai {formatEnvironmentalScore(environmentComponents?.river_proximity_score)}. Nilainya dibatasi agar proxy geografis tidak mendominasi skor; ini indikator pendukung, bukan kepastian banjir atau tanda sedang hujan.</p>
                {drainageScore !== null
                  ? <p>Skor kualitas drainase {drainageScore}/100: {drainageLabel}. Semakin tinggi skor, semakin baik ketersediaan atau kondisi drainase. Nilai ini membantu menurunkan skor risiko.{drainageSource?.method === "nearest_mapped_drainage_quality_proxy" && " Data ini adalah proxy kedekatan jaringan OSM, bukan pemeriksaan fisik."}</p>
                  : drainageIsUnmapped && <p>Drainase tidak terpetakan dekat. Nilai 0 tidak dimasukkan ke perhitungan skor risiko karena bukan bukti drainase rusak.</p>}
                {drainageSource?.drainage_components && <p>Rincian kualitas: kondisi fisik {drainageSource.drainage_components.physical_condition_score}, kapasitas {drainageSource.drainage_components.capacity_score}, cakupan {drainageSource.drainage_components.coverage_score}, pemeliharaan {drainageSource.drainage_components.maintenance_score}, dan sumbatan {drainageSource.drainage_components.obstruction_score}.</p>}
                {environmentSource?.river_distance_m != null && <p>Jarak centroid wilayah ke sungai terdekat: {environmentSource.river_distance_m} m. Nilai ini adalah proxy, bukan kepastian banjir.</p>}
                <p><strong>Ringkasan perhitungan:</strong> skor risiko real-time menggabungkan prakiraan hujan BMKG, kondisi hujan saat ini dari Open-Meteo, durasi hujan, riwayat banjir jika ada, faktor lingkungan, dan kualitas drainase jika ada. BMKG tetap menjadi prakiraan, sedangkan Open-Meteo memperbarui kondisi saat ini setiap kali data dimuat ulang.</p>
              </div>
            </div>
            <div className="rounded-[30px] bg-[#f0e7e2] p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f38a50]">Cuaca BMKG</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Informasi prakiraan</h2><p className="mt-4 text-sm leading-7 text-slate-600">Peluang hujan {probabilityLabel}, dengan prakiraan jumlah {rainfall ?? "Tidak tersedia"} mm pada slot waktu ini{weatherDescription ? ` (${weatherDescription})` : ""}.</p><p className="mt-4 text-xs leading-5 text-slate-500">Data BMKG adalah prakiraan per slot waktu, bukan observasi hujan aktual. Worker memperbarui data BMKG mengikuti siklus 3 jam. Halaman tetap memuat ulang tampilan setiap 5 menit untuk kondisi real-time Open-Meteo. Gunakan carousel pada card di atas untuk melihat jam interval 3 jam lainnya.</p></div>
          </div>

          <div className="mt-8 rounded-[30px] bg-white p-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#26669a]">Transparansi perhitungan</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Sumber informasi wilayah</h2></div><span className="w-fit rounded-full bg-[#f0e7e2] px-3 py-1 text-xs font-bold text-[#123d61]">{explanation?.completeness === "complete" ? "Data lengkap" : explanation?.completeness === "partial" ? "Data sebagian" : "Data terbatas"}</span></div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{explanation?.caveat ?? "Belum ada penjelasan sumber untuk prediksi ini."}</p>
            <p className="mt-2 text-xs text-slate-500">Confidence: {explanation?.confidence ?? "limited"}{explanation?.confidence_reasons?.length ? ` — ${explanation.confidence_reasons.join(", ")}` : ""}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-4">{[["rainfall", "Cuaca dan curah hujan"], ["history", "Riwayat banjir"], ["environment", "Faktor lingkungan"], ["drainage", "Kondisi drainase"]].map(([key, label]) => { const detail = explanation?.sources?.[key]; return <div key={key} className="rounded-2xl bg-[#dfeaf0] p-4"><p className="text-sm font-semibold text-[#123d61]">{label}</p><p className="mt-2 text-xs text-slate-600">{sourceStatus(explanation, key)}{detail?.provider ? ` dari ${detail.provider}` : ""}</p>{detail?.elevation_m != null && <p className="mt-1 text-xs text-slate-500">Elevasi: {detail.elevation_m} m</p>}{detail?.river_distance_m != null && <p className="mt-1 text-xs text-slate-500">Jarak sungai: {detail.river_distance_m} m</p>}{detail?.fetched_at && <p className="mt-1 text-xs text-slate-500">Diambil: {new Date(detail.fetched_at).toLocaleString("id-ID")}</p>}</div>; })}</div>
          </div>

          <div className="mt-8 rounded-[30px] bg-[#123d61] p-8 text-white">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#82d4d0]">AI Data Discovery</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Cari sumber data lingkungan</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-100/75">Gemini membantu menemukan referensi drainase, sungai, tutupan lahan, elevasi, dan histori banjir. Hasilnya hanya kandidat untuk ditinjau dan tidak mengubah skor risiko otomatis.</p>
              </div>
              <button type="button" onClick={runDiscovery} disabled={discoveryLoading || discoveryCooldown} className="rounded-full bg-[#f38a50] px-5 py-3 text-sm font-bold text-[#123d61] disabled:cursor-not-allowed disabled:opacity-60">
                {discoveryLoading ? "Mencari..." : discoveryCooldown ? "Tunggu sebentar..." : "Cari sumber"}
              </button>
            </div>
            {discoveryError && <p className="mt-5 rounded-2xl bg-red-400/20 p-4 text-sm text-red-100">{discoveryError}</p>}
            {discovery && (
              <div className="mt-6 space-y-4">
                {discovery.summary && <p className="rounded-2xl bg-white/10 p-4 text-sm leading-6 text-sky-100">{discovery.summary}</p>}
                {discovery.datasets.length === 0 ? <p className="text-sm text-sky-100/70">Tidak ada kandidat dataset yang dapat ditampilkan.</p> : discovery.datasets.map((dataset) => (
                  <article key={`${dataset.url}-${dataset.title}`} className="rounded-2xl bg-white p-5 text-[#123d61]">
                    <div className="flex flex-col justify-between gap-2 md:flex-row">
                      <div><p className="text-xs font-bold uppercase tracking-wider text-[#f38a50]">{dataset.category}</p><h3 className="mt-1 text-lg font-semibold">{dataset.title}</h3><p className="mt-1 text-sm">{dataset.provider} · {dataset.format} · {dataset.year}</p></div>
                      <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${dataset.status === "reachable" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{dataset.status === "reachable" ? "URL dapat diakses" : "Perlu diperiksa"}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">Cakupan: {dataset.coverage}</p>
                    {dataset.reason && <p className="mt-1 text-sm text-slate-600">{dataset.reason}</p>}
                    <a href={dataset.url} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm font-semibold text-[#26669a] underline">{dataset.url}</a>
                  </article>
                ))}
                <p className="text-xs leading-5 text-sky-100/60">{discovery.disclaimer}</p>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-[30px] bg-[#f0e7e2] p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f38a50]">Saran singkat</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Siapkan lebih awal.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Letakkan barang penting di tempat tinggi, pantau informasi resmi, dan kenali jalur menuju tempat aman.</p><Link href="/mitigasi" className="mt-8 inline-flex rounded-full bg-[#123d61] px-5 py-3 text-sm font-bold text-white">Baca panduan mitigasi</Link></div>
        </div>
      </section>
      <section className="bg-[#f0e7e2] px-6 py-16"><div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Lanjutkan eksplorasi</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Lihat riwayat wilayah ini.</h2></div><Link href="/data-historis" className="rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white">Data Historis ↗</Link></div></section>
    </main>
  );
}
