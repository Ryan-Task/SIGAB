"use client";

import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { useEffect, useRef } from "react";

type RiskPrediction = {
  slug: string;
  name: string;
  regency_code: string;
  regency_name: string;
  centroid_lat: number;
  centroid_lng: number;
  score: number;
  risk_level: "high" | "medium" | "low";
  status: "valid";
  explanation: { caveat: string };
  weather: {
    description: string;
    rainfall_mm: number;
    temperature_c: number;
    humidity_percent: number;
  };
};

type RiskArea = RiskPrediction & {
  detail: string;
  level: "Tinggi" | "Sedang" | "Rendah";
  tone: string;
};

export type MapZone = {
  id: string;
  areas: RiskArea[];
  representative: RiskArea;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type Props = {
  areas: MapZone[];
  selectedArea: RiskArea | null;
  onSelect: (area: RiskArea) => void;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function RiskMap({ areas, selectedArea, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: [-7.45, 112.7],
      zoom: 11,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      map.eachLayer((layer) => layer.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layers = L.layerGroup().addTo(map);
    const positioned = areas.filter((zone) => Number.isFinite(zone.latitude) && Number.isFinite(zone.longitude));

    positioned.forEach((zone) => {
      const center: L.LatLngExpression = [zone.latitude, zone.longitude];
      L.circle(center, {
        radius: zone.radiusMeters,
        color: zone.representative.tone,
        weight: 1,
        fillColor: zone.representative.tone,
        fillOpacity: 0.12,
      }).addTo(layers);

      const marker = L.circleMarker(center, {
        radius: selectedArea?.slug === zone.representative.slug ? 12 : 9,
        color: "#ffffff",
        weight: 3,
        fillColor: zone.representative.tone,
        fillOpacity: 0.9,
      }).addTo(layers);

      const description = escapeHtml(zone.representative.weather.description ?? "Prakiraan BMKG");
      const rainfall = escapeHtml(String(zone.representative.weather.rainfall_mm ?? "-"));
      const temperature = zone.representative.weather.temperature_c === null
        ? ""
        : `<br>Suhu: ${escapeHtml(String(zone.representative.weather.temperature_c))} °C`;
      marker.bindPopup(
        `<strong>Zona ${escapeHtml(zone.id.replace("zone-", ""))}</strong>` +
        `<br>${zone.areas.length} area terpantau` +
        `<br>Risiko tertinggi: ${escapeHtml(zone.representative.level)}` +
        `<br>Cuaca: ${description}` +
        `<br>Hujan: ${rainfall} mm${temperature}`,
      );
      marker.on("click", () => onSelect(zone.representative));
    });

    if (positioned.length > 0) {
      const bounds = L.latLngBounds(positioned.map((zone) => [zone.latitude, zone.longitude]));
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
    }

    return () => {
      layers.remove();
    };
  }, [areas, onSelect, selectedArea]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && selectedArea?.centroid_lat && selectedArea.centroid_lng) {
      map.setView([Number(selectedArea.centroid_lat), Number(selectedArea.centroid_lng)], Math.max(map.getZoom(), 12), { animate: true });
    }
  }, [selectedArea]);

  return <div ref={containerRef} className="relative z-10 h-[375px] w-full rounded-[24px]" />;
}
