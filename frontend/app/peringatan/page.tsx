"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { getAreas, getLatestPredictions, type ApiArea, type ApiPrediction } from "../../lib/api";

const MAX_AREAS = 5;

function regencyLabel(code: string | null): string {
  if (code === "35.15") return "Kabupaten Sidoarjo";
  if (code === "35.78") return "Kota Surabaya";
  return "";
}

function buildDetail(p: ApiPrediction): string {
  const parts: string[] = [];
  const weather = p.weather;
  const rain = Number.parseFloat(String(weather?.rainfall_mm ?? 0));
  if (weather?.description) {
    parts.push(`Cuaca ${weather.description.toLowerCase()}${rain > 0 ? `, prakiraan hujan ${weather.rainfall_mm} mm` : ""}`);
    if (weather.temperature_c != null && weather.humidity_percent != null) {
      parts.push(`suhu ${weather.temperature_c}°C, kelembapan ${weather.humidity_percent}%`);
    }
  }
  const sources = p.explanation?.sources;
  const env = sources?.environment;
  if (env?.elevation_m != null) {
    parts.push(`elevasi ${env.elevation_m} m`);
    if (env.river_distance_m != null) parts.push(`jarak sungai ${Math.round(env.river_distance_m)} m`);
  }
  const drainage = sources?.drainage;
  if (drainage?.nearest_drainage_distance_m != null) {
    parts.push(`drainase terpetakan ${Math.round(drainage.nearest_drainage_distance_m)} m`);
  }
  const rainfall = sources?.rainfall;
  if (rainfall?.accumulated_mm != null) {
    parts.push(`akumulasi hujan ${rainfall.accumulated_mm} mm`);
  }
  if (parts.length === 0) return p.explanation?.caveat ?? "Lihat detail di peta risiko.";
  return `${parts.join(", ")}.`;
}

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

  type RegionDef = { key: string; label: string; regency: string; districts: string[] };

  const REGIONS: RegionDef[] = [
    { key: "sby-pusat", label: "Surabaya Pusat", regency: "35.78", districts: ["35.78.05", "35.78.06", "35.78.07", "35.78.08", "35.78.11", "35.78.12", "35.78.13", "35.78.15"] },
    { key: "sby-utara", label: "Surabaya Utara", regency: "35.78", districts: ["35.78.16", "35.78.17", "35.78.26"] },
    { key: "sby-timur", label: "Surabaya Timur", regency: "35.78", districts: ["35.78.03", "35.78.09", "35.78.10", "35.78.24", "35.78.25", "35.78.29"] },
    { key: "sby-selatan", label: "Surabaya Selatan", regency: "35.78", districts: ["35.78.01", "35.78.02", "35.78.04", "35.78.20", "35.78.21", "35.78.22", "35.78.23"] },
    { key: "sby-barat", label: "Surabaya Barat", regency: "35.78", districts: ["35.78.14", "35.78.18", "35.78.19", "35.78.27", "35.78.28", "35.78.30", "35.78.31"] },
    { key: "sda-barat", label: "Sidoarjo Barat", regency: "35.15", districts: ["35.15.01", "35.15.02", "35.15.03", "35.15.10", "35.15.11", "35.15.12"] },
    { key: "sda-tengah", label: "Sidoarjo Tengah (KODA)", regency: "35.15", districts: ["35.15.07", "35.15.08", "35.15.09", "35.15.14", "35.15.15"] },
    { key: "sda-utara", label: "Sidoarjo Utara", regency: "35.15", districts: ["35.15.13", "35.15.16", "35.15.17", "35.15.18"] },
    { key: "sda-selatan", label: "Sidoarjo Selatan", regency: "35.15", districts: ["35.15.04", "35.15.05", "35.15.06"] },
  ];

  function districtCode(p: ApiPrediction): string | null {
    if (!p.code) return null;
    const parts = p.code.split(".");
    return parts.length >= 3 ? parts.slice(0, 3).join(".") : null;
  }

  function rainfallMm(p: ApiPrediction): number {
    return Number.parseFloat(String(p.weather?.rainfall_mm ?? 0)) || 0;
  }

  function isRaining(p: ApiPrediction): boolean {
    const desc = (p.weather?.description ?? "").toLowerCase();
    return rainfallMm(p) >= 1 || /hujan|rain|gerimis|drizzle|petir|thunder/.test(desc);
  }

  function avgText(r: { avgRain: number }): string {
    return r.avgRain > 0 ? `, rata-rata hujan ${r.avgRain.toFixed(1)} mm` : "";
  }

  export default function PeringatanPage() {
  const [areas, setAreas] = useState<ApiArea[]>([]);
  const [predictions, setPredictions] = useState<ApiPrediction[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [regionKey, setRegionKey] = useState<string>("sby-pusat");
  const [districtCodeFilter, setDistrictCodeFilter] = useState<string | null>(null);
  const [regencyFilter, setRegencyFilter] = useState<string>("all");

  useEffect(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        try {
          const [areasResp, predictionsResp] = await Promise.allSettled([
            getAreas(),
            getLatestPredictions(),
          ]);

          if (cancelled) return;
          if (areasResp.status === "fulfilled") {
            setAreas(areasResp.value);
          }
          if (predictionsResp.status === "fulfilled") {
            // /v1/predictions/latest already carries the same realtime blend as the
            // wilayah detail page, so there is no per-slug override to run here.
            setPredictions(predictionsResp.value);
            setLoading(false);
            return;
          }
          if (areasResp.status === "rejected" && predictionsResp.status === "rejected") {
            const reason = predictionsResp.reason ?? areasResp.reason;
            throw reason instanceof Error ? reason : new Error("Gagal memuat data peringatan");
          }
        } catch (e: any) {
          if (!cancelled) setError(e?.message ?? "Gagal memuat data peringatan");
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, []);

  // Derived values are memoized so that unrelated state changes (active tab,
  // filters) do not recompute 500 predictions worth of grouping on every render.
  const allAlerts = useMemo(() => predictions
    .filter((p) => p.score != null && p.score > 0)
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
    .map((p) => {
      const area = areas.find((a) => a.slug === p.slug);
      const locationLabel = regencyLabel(p.regency_code ?? area?.regency_code ?? null)
        || p.regency_name || area?.regency_name || "Wilayah terintegrasi";
      const levelMap: Record<string, string> = {
        high: "Tinggi",
        medium: "Sedang",
        low: "Rendah",
        insufficient: "Tidak Tahu",
      };
      const level = levelMap[p.risk_level ?? "insufficient"] ?? "Tidak Tahu";
      const timeSource = p.realtime_calculated_at ?? p.calculated_at;
      const timeAgo = timeSource
        ? new Date(timeSource.replace(" ", "T")).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "Baru saja";
      return {
        area: locationLabel,
        title: p.name,
        level,
        time: timeAgo,
        detail: buildDetail(p),
        score: p.score,
        slug: p.slug,
        districtCode: districtCode(p),
      };
    }), [predictions, areas]);

  const alerts = useMemo(() => allAlerts.slice(0, MAX_AREAS), [allAlerts]);

  // Stats per wilayah besar (grup kecamatan)
  const regionStats = useMemo(() => REGIONS.map((r) => {
    const dset = new Set(r.districts);
    const members = predictions.filter((p) => {
      const d = districtCode(p);
      return d !== null && dset.has(d);
    });
    const raining = members.filter(isRaining);
    const districtsRaining = new Set(raining.map(districtCode).filter(Boolean)).size;
    const avgRain = members.length > 0
      ? members.reduce((sum, p) => sum + rainfallMm(p), 0) / members.length
      : 0;
    const descriptions = members
      .map((p) => p.weather?.description)
      .filter((d): d is string => Boolean(d));
    const dominant = descriptions.length > 0
      ? descriptions.sort((a, b) =>
          descriptions.filter((d) => d === b).length - descriptions.filter((d) => d === a).length
        )[0]
      : "Tidak diketahui";
    return {
      ...r,
      areaCount: members.length,
      rainingCount: raining.length,
      districtsRaining,
      avgRain,
      dominant,
      raining: raining.length > 0,
    };
  }), [predictions]);

  const visibleRegions = useMemo(
    () => regionStats.filter((r) => regencyFilter === "all" || r.regency === regencyFilter),
    [regionStats, regencyFilter],
  );
  const currentRegion = visibleRegions.find((r) => r.key === regionKey) ?? visibleRegions[0] ?? regionStats[0];
  const currentDistricts = useMemo(() => currentRegion
    ? currentRegion.districts.map((code) => {
        const members = predictions.filter((p) => districtCode(p) === code);
        const raining = members.filter(isRaining).length;
        return {
          code,
          name: KECAMATAN[code] ?? code,
          areaCount: members.length,
          raining: raining > 0,
          rainingCount: raining,
        };
      })
    : [], [currentRegion, predictions]);

  const districtAlerts = useMemo(
    () => districtCodeFilter
      ? allAlerts.filter((alert) => alert.districtCode === districtCodeFilter)
      : alerts,
    [allAlerts, alerts, districtCodeFilter],
  );
  const visibleAlerts = districtAlerts.length > 0 ? districtAlerts : alerts;
  const selected = visibleAlerts[Math.min(active, visibleAlerts.length - 1)];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
        <SiteNav />
        <section className="bg-[#123d61] px-6 pb-16 pt-32 text-white">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Pusat informasi</p>
                <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.08em] sm:text-7xl">Waspada,<br />bukan panik.</h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-sky-100/75">Sedang memuat data peringatan banjir terbaru...</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-sky-100/70"><span className="h-2 w-2 animate-pulse rounded-full bg-[#f38a50]" />Live monitoring</div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
        <SiteNav />
        <section className="bg-[#123d61] px-6 pb-16 pt-32 text-white">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Pusat informasi</p>
                <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.08em] sm:text-7xl">Waspada,<br />bukan panik.</h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-sky-100/75">Terjadi kesalahan: {error}</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-sky-100/70"><span className="h-2 w-2 animate-pulse rounded-full bg-[#f38a50]" />Live monitoring</div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (alerts.length === 0) {
    return (
      <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
        <SiteNav />
        <section className="bg-[#123d61] px-6 pb-16 pt-32 text-white">
          <div className="mx-auto max-w-[1180px]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Pusat informasi</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.08em] sm:text-7xl">Waspada,<br />bukan panik.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-sky-100/75">Belum ada data peringatan. Pastikan server Laravel aktif.</p>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />
      <section className="bg-[#123d61] px-6 pb-16 pt-32 text-white">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Pusat informasi</p>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-[-0.08em] sm:text-7xl">Waspada,<br />bukan panik.</h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-sky-100/75">Ringkasan kondisi terbaru untuk membantu Anda menentukan langkah dengan tenang dan cepat.</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-sky-100/70"><span className="h-2 w-2 animate-pulse rounded-full bg-[#f38a50]" />Live monitoring</div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Cek kondisi per wilayah</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Sedang hujan di mana?</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={regencyFilter}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setRegencyFilter(v);
                                  const first = REGIONS.find((r) => v === "all" || r.regency === v);
                                  if (first) {
                                    setRegionKey(first.key);
                                    setDistrictCodeFilter(null);
                                    setActive(0);
                                  }
                                }}
                className="rounded-full border border-[#26669a]/25 bg-white px-5 py-3 text-sm font-semibold text-[#123d61] outline-none transition hover:border-[#26669a]/60"
              >
                <option value="all">Semua Kabupaten/Kota</option>
                <option value="35.78">Kota Surabaya</option>
                <option value="35.15">Kabupaten Sidoarjo</option>
              </select>
              <select
                value={regionKey}
                onChange={(e) => {
                  setRegionKey(e.target.value);
                  setDistrictCodeFilter(null);
                  setActive(0);
                }}
                className="rounded-full border border-[#26669a]/25 bg-white px-5 py-3 text-sm font-semibold text-[#123d61] outline-none transition hover:border-[#26669a]/60"
              >
                {visibleRegions.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 pt-8">
        <div className="mx-auto grid max-w-[1180px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRegions.map((r) => {
            const activeRegion = r.key === regionKey;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  setRegionKey(r.key);
                  setDistrictCodeFilter(null);
                  setActive(0);
                }}
                className={`rounded-3xl p-6 text-left transition ${activeRegion ? "bg-[#123d61] text-white shadow-[0_12px_30px_rgba(18,61,97,0.25)]" : "bg-[#f0e7e2] hover:bg-[#e8ded8]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.18em] ${activeRegion ? "text-[#82d4d0]" : "text-[#f38a50]"}`}>{regencyLabel(r.regency)}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{r.label}</h3>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${r.raining ? "bg-[#f38a50] text-[#123d61]" : "bg-[#82d4d0] text-[#123d61]"}`}>
                    {r.raining ? "Hujan" : "Cerah"}
                  </span>
                </div>
                <p className={`mt-4 text-sm leading-6 ${activeRegion ? "text-sky-100/75" : "text-slate-500"}`}>
                  {r.areaCount} desa/kelurahan dipantau, {r.rainingCount} wilayah hujan{avgText(r)}
                </p>
                <p className={`mt-2 text-sm font-semibold ${activeRegion ? "text-sky-100/90" : "text-[#26669a]"}`}>
                  {r.dominant}
                </p>
              </button>
            );
          })}
        </div>

        {currentRegion && (
          <div className="mx-auto mt-10 max-w-[1180px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-[#123d61]">Kecamatan di {currentRegion.label}</h3>
              <span className="text-xs text-slate-500">{currentRegion.districtsRaining} kecamatan sedang hujan</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {currentDistricts.map((d) => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => {
                    setDistrictCodeFilter(d.code);
                    setActive(0);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition hover:border-[#26669a]/40 ${districtCodeFilter === d.code ? "border-[#123d61] bg-[#123d61] text-white shadow-[0_8px_20px_rgba(18,61,97,0.18)]" : d.raining ? "border-[#f38a50]/50 bg-[#f38a50]/10" : "border-[#26669a]/10 bg-white"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold ${districtCodeFilter === d.code ? "text-white" : "text-[#123d61]"}`}>{d.name}</p>
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${d.raining ? "bg-[#f38a50]" : "bg-[#82d4d0]"}`} />
                  </div>
                  <p className={`mt-1 text-xs ${districtCodeFilter === d.code ? "text-sky-100/75" : "text-slate-500"}`}>
                    {d.areaCount} wilayah, {d.raining ? `${d.rainingCount} sedang hujan` : "tidak hujan"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            key={selected.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[32px] bg-[#f38a50] p-8 text-[#123d61] sm:p-12"
          >
            <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[34px] border-white/20" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Peringatan terpilih</p>
            <h2 className="mt-8 max-w-lg text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-5xl">{selected.title}</h2>
            <p className="mt-5 max-w-md text-base leading-8 text-[#123d61]/75">{selected.detail}</p>
            <div className="mt-12 flex items-end justify-between gap-4">
              <div><p className="text-sm font-semibold">{selected.area}</p><p className="mt-1 text-xs text-[#123d61]/60">{selected.time}</p></div>
                          <span className="rounded-full bg-[#123d61] px-4 py-2 text-xs font-bold text-white">{selected.level}, skor risiko banjir {selected.score ?? "belum tersedia"} dari 100</span>
            </div>
          </motion.div>

          <div className="space-y-3">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">
                {districtCodeFilter ? `Wilayah di ${KECAMATAN[districtCodeFilter] ?? districtCodeFilter}` : "Daftar status"}
              </p>
              <span className="text-xs text-slate-500">{visibleAlerts.length} wilayah dipantau</span>
            </div>
            {visibleAlerts.map((alert, index) => (
                          <button
                            key={alert.slug}
                            type="button"
                            onClick={() => setActive(index)}
                            className={`group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition ${index === active ? "bg-white shadow-[0_12px_30px_rgba(38,102,154,0.12)]" : "hover:bg-white/60"}`}
                          >
                <span className={`h-3 w-3 shrink-0 rounded-full ${alert.level === "Tinggi" ? "bg-[#f38a50]" : alert.level === "Sedang" ? "bg-[#82d4d0]" : "bg-[#26669a]"}`} />
                <span className="min-w-0 flex-1"><span className="block font-semibold text-[#123d61]">{alert.title}</span><span className="mt-1 block truncate text-sm text-slate-500">{alert.area}, {alert.level}, skor risiko banjir {alert.score ?? "belum tersedia"} dari 100</span></span>
              </button>
            ))}
            <div className="mt-6 rounded-2xl border border-[#26669a]/15 bg-[#f0e7e2] p-5 text-sm leading-7 text-slate-600"><strong className="text-[#123d61]">Sumber informasi</strong><br />Status ditampilkan sebagai informasi pendukung. Selalu ikuti arahan resmi BPBD dan BMKG.</div>
          </div>
        </div>
      </section>

      <section className="bg-[#f0e7e2] px-6 py-16">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f38a50]">Tindakan berikutnya</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">Ingin memahami wilayah Anda?</h2></div><Link href="/peta-risiko" className="shrink-0 rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123d61]">Buka Peta Risiko</Link></div>
      </section>
      <SiteFooter />
    </main>
  );
}