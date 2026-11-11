import { Suspense } from "react";
import SiteFooter from "../../components/SiteFooter";
import { getAreaCurrentWeather, getAreaRainfall, getAreaRisk } from "../../../lib/api";
import WilayahRoute from "./WilayahRoute";
import type { WilayahInitialData } from "./WilayahView";

export function generateStaticParams() {
  return [{ slug: "surabaya" }];
}

// Prefetch on the server so the first HTML already contains the risk score
// instead of rendering empty cards until hydration finishes.
async function loadInitialData(slug: string): Promise<WilayahInitialData> {
  const [risk, rainfall, weather] = await Promise.allSettled([
    getAreaRisk(slug),
    getAreaRainfall(slug),
    getAreaCurrentWeather(slug),
  ]);

  return {
      risk: risk.status === "fulfilled" ? risk.value : null,
      rainfall: rainfall.status === "fulfilled" ? rainfall.value.data : null,
      weather: weather.status === "fulfilled" ? weather.value : null,
    };
}

async function WilayahData({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initial = await loadInitialData(slug);
  return <WilayahRoute params={Promise.resolve({ slug })} initial={initial} />;
}

export default function WilayahPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#dfeaf0]" />}>
      <WilayahData params={params} />
      <SiteFooter />
    </Suspense>
  );
}
