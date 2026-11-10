"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SiteNav from "../components/SiteNav";
import { getAreaRisk, getLatestPredictions, type ApiPrediction } from "../../lib/api";
import type { MapZone } from "./RiskMap";
import dynamic from "next/dynamic";

const RiskMap = dynamic(() => import("./RiskMap"), { ssr: false });

type RiskLevel = "Tinggi" | "Sedang" | "Rendah";

type RiskArea = ApiPrediction & { detail: string; level: RiskLevel; tone: string };
const ZONE_RADIUS_METERS = 1000;

const riskColors: Record<RiskLevel, string> = {
  Tinggi: "bg-[#f38a50] text-[#123d61]",
  Sedang: "bg-[#82d4d0] text-[#123d61]",
  Rendah: "bg-[#26669a] text-white",
};

function toRiskArea(prediction: ApiPrediction): RiskArea {
  const level = prediction.risk_level === "high" ? "Tinggi" : prediction.risk_level === "medium" ? "Sedang" : "Rendah";
  return {
    ...prediction,
    detail: prediction.status === "valid" ? "Estimasi berdasarkan data tersedia" : "Data belum cukup untuk kategori risiko",
    level,
    tone: level === "Tinggi" ? "#f38a50" : level === "Sedang" ? "#82d4d0" : "#26669a",
  };
}

function withRealtimePrediction(area: RiskArea, prediction: Awaited<ReturnType<typeof getAreaRisk>>["prediction"]): RiskArea {
  if (prediction === null) return area;
  return toRiskArea({
    ...area,
    score: prediction.score,
    risk_level: prediction.risk_level,
    status: prediction.status,
    explanation: prediction.explanation,
    calculated_at: prediction.realtime_calculated_at ?? prediction.calculated_at,
    current_weather_score: prediction.current_weather_score,
    realtime_calculated_at: prediction.realtime_calculated_at,
  });
}

function regencyLabel(area: Pick<ApiPrediction, "regency_code" | "regency_name">): string {
  if (area.regency_code === "35.15") return "Kabupaten Sidoarjo";
  if (area.regency_code === "35.78") return "Kota Surabaya";
  return area.regency_name && !/^\d+(?:\.\d+)+$/.test(area.regency_name)
    ? area.regency_name
    : "Wilayah";
}

function distanceMeters(left: RiskArea, right: RiskArea): number {
  if (!left.centroid_lat || !left.centroid_lng || !right.centroid_lat || !right.centroid_lng) return Number.POSITIVE_INFINITY;
  const earthRadius = 6371000;
  const lat1 = Number(left.centroid_lat) * Math.PI / 180;
  const lat2 = Number(right.centroid_lat) * Math.PI / 180;
  const deltaLat = lat2 - lat1;
  const deltaLng = (Number(right.centroid_lng) - Number(left.centroid_lng)) * Math.PI / 180;
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function createMapZones(areas: RiskArea[]): MapZone[] {
  const positioned = areas.filter((area) => area.centroid_lat && area.centroid_lng);
  const zones: RiskArea[][] = [];
  for (const area of positioned) {
    const zone = zones.find((candidate) => candidate.some((member) => distanceMeters(member, area) <= ZONE_RADIUS_METERS));
    if (zone) zone.push(area);
    else zones.push([area]);
  }
  return zones.map((members, index) => {
    const representative = [...members].sort((left, right) => (right.score ?? -1) - (left.score ?? -1))[0];
    return {
      id: `zone-${index + 1}`,
      areas: members,
      representative,
      latitude: members.reduce((sum, area) => sum + Number(area.centroid_lat), 0) / members.length,
      longitude: members.reduce((sum, area) => sum + Number(area.centroid_lng), 0) / members.length,
      radiusMeters: ZONE_RADIUS_METERS,
    };
  });
}

function getPaginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, 2, totalPages - 1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const items: Array<number | "ellipsis"> = [];
  let previousPage = 0;

  for (const pageNumber of [...pages].sort((left, right) => left - right)) {
    if (pageNumber < 1 || pageNumber > totalPages) continue;
    if (pageNumber - previousPage > 1) items.push("ellipsis");
    items.push(pageNumber);
    previousPage = pageNumber;
  }

  return items;
}

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
  const realtimeCacheRef = useRef(new Map<string, {
    prediction: Awaited<ReturnType<typeof getAreaRisk>>["prediction"];
    expiresAt: number;
  }>());
  const [riskAreas, setRiskAreas] = useState<RiskArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<RiskArea | null>(null);
  const [filter, setFilter] = useState<"Semua" | RiskLevel>("Semua");
  const [regency, setRegency] = useState("Semua");
  const [selectedRegency, setSelectedRegency] = useState("Semua");
  const [selectedAreaSearch, setSelectedAreaSearch] = useState("");
  const [sort, setSort] = useState<"risk" | "name">("risk");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<5 | 10>(5);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedRealtimeLoading, setSelectedRealtimeLoading] = useState(false);
  const [loadingSlugs, setLoadingSlugs] = useState<Set<string>>(new Set());
  const [realtimeReadySlugs, setRealtimeReadySlugs] = useState<Set<string>>(new Set());
  const [selectedRefreshToken, setSelectedRefreshToken] = useState(0);
  const latestLoadTokenRef = useRef(0);
  const getCachedRisk = (slug: string) => {
    const cached = realtimeCacheRef.current.get(slug);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve({ prediction: cached.prediction });
    }
    return getAreaRisk(slug).then((result) => {
      realtimeCacheRef.current.set(slug, {
        prediction: result.prediction,
        expiresAt: Date.now() + 300_000,
      });
      return result;
    });
  };
  const selectArea = (area: RiskArea) => {
    const cached = realtimeCacheRef.current.get(area.slug);
    setSelectedArea(cached && cached.expiresAt > Date.now()
      ? withRealtimePrediction(area, cached.prediction)
      : { ...area, score: null });
    if (cached && cached.expiresAt > Date.now()) {
      setRealtimeReadySlugs((current) => new Set(current).add(area.slug));
    } else {
      setRealtimeReadySlugs((current) => {
        const next = new Set(current);
        next.delete(area.slug);
        return next;
      });
    }
    setSelectedRefreshToken((token) => token + 1);
  };
  useEffect(() => {
    const load = () => {
      const loadToken = latestLoadTokenRef.current + 1;
      latestLoadTokenRef.current = loadToken;
      return getLatestPredictions()
      .then((predictions) => {
        if (loadToken !== latestLoadTokenRef.current) return;
        const areas = predictions.map(toRiskArea).map((area) => {
          const cached = realtimeCacheRef.current.get(area.slug);
          return cached && cached.expiresAt > Date.now()
            ? withRealtimePrediction(area, cached.prediction)
            : area;
        });
        setRiskAreas(areas);
        setRealtimeReadySlugs(new Set(
          areas
            .filter((area) => {
              const cached = realtimeCacheRef.current.get(area.slug);
              return cached !== undefined && cached.expiresAt > Date.now();
            })
            .map((area) => area.slug),
        ));
        setSelectedArea((current) => current
          ? areas.find((area) => area.slug === current.slug) ?? areas[0] ?? null
          : areas[0] ?? null);
      })
      .catch(() => {
        if (loadToken === latestLoadTokenRef.current) {
          setError("Data risiko belum dapat dimuat. Pastikan server Laravel aktif.");
        }
      });
    };
    load();
    const refresh = window.setInterval(load, 300_000);
    return () => window.clearInterval(refresh);
  }, []);
  useEffect(() => {
    if (!selectedArea) return;
    let active = true;
    setSelectedRealtimeLoading(true);
    getCachedRisk(selectedArea.slug)
      .then(({ prediction }) => {
        if (!active) return;
        setSelectedRealtimeLoading(false);
        if (prediction === null) return;
        setRiskAreas((areas) => areas.map((area) => area.slug === selectedArea.slug
          ? withRealtimePrediction(area, prediction)
          : area));
        setRealtimeReadySlugs((slugs) => new Set(slugs).add(selectedArea.slug));
        setSelectedArea((area) => area?.slug === selectedArea.slug
          ? withRealtimePrediction(area, prediction)
          : area);
      })
      .catch(() => {
        if (active) {
          setSelectedRealtimeLoading(false);
          setError("Skor risiko banjir real-time belum dapat diperbarui.");
        }
      });
    return () => { active = false; };
  }, [selectedArea?.slug, selectedRefreshToken]);
  useEffect(() => {
    setPage(1);
  }, [filter, regency, search, pageSize]);
  const regencies = [...new Map(
    riskAreas
      .filter((area) => area.regency_code)
      .map((area) => [area.regency_code as string, regencyLabel(area)] as const),
  )].sort((left, right) => left[1].localeCompare(right[1], "id"));
  const orderedAreas = [...riskAreas].sort((left, right) => {
    const regencyComparison = (left.regency_name ?? "").localeCompare(right.regency_name ?? "", "id");
    return regencyComparison || left.name.localeCompare(right.name, "id");
  });
  const selectedOptions = selectedRegency === "Semua"
    ? []
    : orderedAreas.filter((area) =>
      area.regency_code === selectedRegency &&
      area.name.toLowerCase().includes(selectedAreaSearch.toLowerCase()),
    );
  const visibleAreas = riskAreas.filter((area) =>
    (filter === "Semua" || area.level === filter) &&
    (regency === "Semua" || area.regency_code === regency) &&
    area.name.toLowerCase().includes(search.toLowerCase()),
  ).sort((left, right) => sort === "name"
    ? left.name.localeCompare(right.name, "id")
    : (right.score ?? -1) - (left.score ?? -1));
  const totalPages = Math.max(1, Math.ceil(visibleAreas.length / pageSize));
  const pagedAreas = visibleAreas.slice((page - 1) * pageSize, page * pageSize);
  const selectedExactMatch = selectedOptions.some((area) => area.name.toLowerCase() === selectedAreaSearch.trim().toLowerCase());
  const paginationItems = getPaginationItems(page, totalPages);
  const mapZones = createMapZones(visibleAreas);
  const pagedSlugsKey = pagedAreas.map((area) => area.slug).join("|");
  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);
  useEffect(() => {
    let active = true;
    const slugs = pagedSlugsKey ? pagedSlugsKey.split("|") : [];
    if (slugs.length === 0) return () => { active = false; };
    setLoadingSlugs(new Set(slugs));
    setRealtimeReadySlugs((current) => {
      const next = new Set(current);
      slugs.forEach((slug) => next.delete(slug));
      return next;
    });
    Promise.all(slugs.map((slug) => getCachedRisk(slug)
      .then(({ prediction }) => ({ slug, prediction, error: false }))
      .catch(() => ({ slug, prediction: null, error: true }))))
      .then((results) => {
        if (!active) return;
        setLoadingSlugs((current) => {
          const next = new Set(current);
          slugs.forEach((slug) => next.delete(slug));
          return next;
        });
        setRealtimeReadySlugs((current) => {
          const next = new Set(current);
          results.forEach((result) => {
            if (result.prediction !== null) next.add(result.slug);
          });
          return next;
        });
        const realtimeBySlug = new Map(
          results
            .filter((result) => result.prediction !== null)
            .map((result) => [result.slug, result.prediction] as const),
        );
        if (results.some((result) => result.error)) {
          setError("Sebagian skor risiko banjir real-time belum dapat diperbarui.");
        }
        if (realtimeBySlug.size === 0) return;
        setRiskAreas((areas) => areas.map((area) => {
          const prediction = realtimeBySlug.get(area.slug);
          if (prediction === undefined || prediction === null) return area;
          return {
            ...withRealtimePrediction(area, prediction),
          };
        }));
        setSelectedArea((area) => {
          if (!area) return area;
          const prediction = realtimeBySlug.get(area.slug);
          if (prediction === undefined || prediction === null) return area;
          return {
            ...area,
            score: prediction.score,
            risk_level: prediction.risk_level,
            status: prediction.status,
            explanation: prediction.explanation,
            calculated_at: prediction.realtime_calculated_at ?? prediction.calculated_at,
          };
        });
      })
      .catch(() => {
        if (active) {
          setLoadingSlugs((current) => {
            const next = new Set(current);
            slugs.forEach((slug) => next.delete(slug));
            return next;
          });
          setError("Sebagian skor risiko banjir real-time belum dapat diperbarui.");
        }
      });
    return () => { active = false; };
  }, [page, pageSize, filter, regency, search, sort, riskAreas.length]);

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
                Jelajahi gambaran risiko banjir per wilayah. Pilih area untuk melihat status, skor risiko banjir, dan faktor yang perlu diperhatikan.
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
                <h2 className="mt-2 text-2xl font-semibold">Sidoarjo, Surabaya dan sekitarnya</h2>
              </div>
              <span className="rounded-full bg-[#f38a50] px-3 py-1.5 text-xs font-bold text-[#123d61]">Waspada</span>
            </div>
            <div className="relative z-10 mt-10 h-[375px]">
              <RiskMap areas={mapZones} selectedArea={selectedArea} onSelect={selectArea} />
              {selectedArea && (
                <div className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-2xl border border-[#82d4d0]/60 bg-[#123d61]/90 px-4 py-3 text-white shadow-lg backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82d4d0]">Area aktif di peta</p>
                  <p className="mt-1 truncate text-sm font-semibold">{selectedArea.name}</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 rounded-2xl border border-white/20 bg-[#123d61]/60 p-4 text-xs text-sky-100 backdrop-blur-md">
                {mapZones.length} zona, radius 1 km. Geser peta, zoom, atau klik zona untuk melihat risiko
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
            <select
              value={selectedRegency}
              onChange={(event) => {
                setSelectedRegency(event.target.value);
                setSelectedAreaSearch("");
                setSelectedArea((current) => current && current.regency_code === event.target.value ? current : null);
              }}
              className="mt-3 w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-[#123d61] outline-none"
              aria-label="Pilih kabupaten atau kota"
            >
              <option value="Semua">1. Pilih kabupaten/kota</option>
              {regencies.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            <label className="mt-4 block text-xs font-semibold text-[#26669a]" htmlFor="area-search">
              2. Cari atau pilih wilayah
            </label>
            <input
              id="area-search"
              list="area-recommendations"
              value={selectedAreaSearch}
              disabled={selectedRegency === "Semua"}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedAreaSearch(value);
                if (!value.trim()) setSelectedArea(null);
                const selected = orderedAreas.find((area) =>
                  area.regency_code === selectedRegency &&
                  area.name.toLowerCase() === value.trim().toLowerCase(),
                );
                if (selected) selectArea(selected);
              }}
              placeholder={selectedRegency === "Semua" ? "Pilih kabupaten/kota terlebih dahulu" : "Ketik nama wilayah..."}
              className="mt-2 w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-[#123d61] outline-none disabled:cursor-not-allowed disabled:bg-slate-200"
              aria-label="Cari atau pilih wilayah"
            />
            {selectedRegency !== "Semua" && selectedAreaSearch && !selectedExactMatch && selectedOptions.length > 0 && (
              <div className="mt-2 max-h-36 overflow-y-auto rounded-xl bg-white p-2">
                {selectedOptions.slice(0, 8).map((area) => (
                  <button
                    key={area.slug}
                    type="button"
                    onClick={() => {
                      selectArea(area);
                      setSelectedAreaSearch(area.name);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-xs text-[#123d61] hover:bg-[#dfeaf0]"
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            )}
            {error && <p className="mt-4 text-sm text-slate-600">{error}</p>}
            {!selectedArea && !error && <p className="mt-4 text-sm text-slate-600">Memuat data risiko...</p>}
            {selectedArea && <>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#26669a]">Sedang melihat area</p>
                <h2 className="text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">{selectedArea.name}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${riskColors[selectedArea.level]}`}>
                {selectedRealtimeLoading ? "Memuat…" : selectedArea.level}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{selectedArea.detail}</p>
            {selectedArea.explanation?.caveat && <p className="mt-2 text-xs leading-5 text-slate-500">{selectedArea.explanation.caveat}</p>}
            <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-slate-600">
              <p className="font-semibold text-[#123d61]">Prakiraan BMKG terbaru</p>
              <p className="mt-1">{selectedArea.weather.description ?? "Prakiraan cuaca tersedia"}</p>
              <p className="mt-1">
                Prakiraan hujan {selectedArea.weather.rainfall_mm ?? "-"} mm
                {selectedArea.weather.temperature_c != null && ` · Suhu ${selectedArea.weather.temperature_c} °C`}
                {selectedArea.weather.humidity_percent != null && ` · Kelembapan ${selectedArea.weather.humidity_percent}%`}
              </p>
            </div>
            <div className="mt-8 flex items-end gap-3">
              <span className="text-7xl font-semibold leading-none tracking-[-0.1em] text-[#123d61]">
                {selectedRealtimeLoading ? "…" : selectedArea.score ?? "—"}
              </span>
              <span className="pb-2 text-sm text-slate-500">
                skor risiko banjir<br />dari 100
                {selectedRealtimeLoading && <small className="mt-1 block text-xs">Memperbarui…</small>}
              </span>
            </div>
            <div className="mt-6 h-2 rounded-full bg-white">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedArea.score ?? 0}%` }}
                className="h-2 rounded-full bg-[#f38a50]"
              />
            </div>
            <Link href={`/wilayah/${selectedArea.slug}`} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123d61]">
              Lihat detail wilayah
            </Link>
            </>}
          </motion.aside>
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
