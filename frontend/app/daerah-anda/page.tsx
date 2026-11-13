"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";
import {
  getAreaCurrentWeather,
  getAreaRainfall,
  getCachedAreaRisk,
  getCurrentUser,
  getUserLocations,
  type ApiCurrentWeather,
  type ApiRainfallRecord,
  type UserLocation,
} from "../../lib/api";

type Monitor = UserLocation & {
  score: number | null;
  riskLevel: string;
  loading: boolean;
  weather: ApiCurrentWeather | null;
  forecast: ApiRainfallRecord | null;
};

export default function MyAreasPage() {
  const [locations, setLocations] = useState<Monitor[]>([]);

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) {
        window.location.replace("/login");
        return;
      }
      const saved = await getUserLocations();
      setLocations(saved.map((location) => ({
        ...location,
        score: null,
        riskLevel: "Memuat",
        loading: true,
        weather: null,
        forecast: null,
      })));
      const monitored = await Promise.all(saved.map(async (location) => {
        const [risk, weather, rainfall] = await Promise.allSettled([
          getCachedAreaRisk(location.slug),
          getAreaCurrentWeather(location.slug),
          getAreaRainfall(location.slug),
        ]);
        const prediction = risk.status === "fulfilled" ? risk.value.prediction : null;
        return {
          ...location,
          score: prediction?.score ?? null,
          riskLevel: prediction?.risk_level ?? "Tidak tersedia",
          loading: false,
          weather: weather.status === "fulfilled" ? weather.value : null,
          forecast: rainfall.status === "fulfilled" ? rainfall.value.data[0] ?? null : null,
        };
      }));
      setLocations(monitored);
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />
      <section className="mx-auto min-h-screen max-w-5xl px-6 pb-24 pt-32">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Pantauan pribadi</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.07em] text-[#123d61]">Daerah Anda</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Pantau skor risiko banjir dari wilayah yang Anda simpan.</p>
        {locations.length === 0 ? (
          <div className="mt-10 rounded-[28px] bg-white p-8 text-sm text-slate-600">
            Belum ada daerah yang disimpan. <Link href="/profil" className="font-semibold text-[#26669a]">Tambahkan di profil.</Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {locations.map((location) => (
              <article key={location.id} className="rounded-[28px] bg-white p-7 shadow-[0_24px_60px_rgba(38,102,154,0.12)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#26669a]">{location.regency_name ?? "Wilayah"}</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#123d61]">{location.label ?? location.name}</h2>
                <div className="mt-8 flex items-end gap-3">
                  <span className="text-6xl font-semibold tracking-[-0.08em] text-[#123d61]">{location.loading ? "..." : location.score ?? "—"}</span>
                  <span className="pb-2 text-sm text-slate-500">Skor risiko banjir<br />dari 100</span>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Status: <span className="font-semibold">
                    {location.riskLevel === "high" ? "Tinggi" : location.riskLevel === "medium" ? "Sedang" : location.riskLevel === "low" ? "Rendah" : location.riskLevel === "insufficient" ? "Data belum cukup" : location.riskLevel}
                  </span>
                </p>
                <div className="mt-6 rounded-2xl bg-[#f0e7e2] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f38a50]">Cuaca hari ini</p>
                  {location.loading ? (
                    <p className="mt-2 text-sm text-slate-600">Memuat kondisi cuaca...</p>
                  ) : (
                    <>
                      <p className="mt-2 text-lg font-semibold text-[#123d61]">
                        {location.weather?.current.is_raining
                          ? "Sedang hujan"
                          : location.forecast?.weather_description ?? "Tidak ada hujan terdeteksi"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Hujan {location.forecast?.rainfall_mm ?? "0"} mm
                        {location.forecast?.rainfall_probability != null
                          ? `, peluang ${location.forecast.rainfall_probability}%`
                          : ""}
                        {location.weather?.current.weather_code != null
                          ? `, kondisi saat ini diperbarui ${new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(location.weather.current.time ?? Date.now()))}`
                          : ""}
                      </p>
                    </>
                  )}
                </div>
                <Link href={`/wilayah/${location.slug}`} className="mt-6 inline-flex rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white">Lihat detail wilayah</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
