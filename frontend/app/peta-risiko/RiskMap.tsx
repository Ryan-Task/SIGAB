"use client";

import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { useEffect, useRef } from "react";
import type { ApiPrediction } from "../../lib/api";

type RiskArea = ApiPrediction & {
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
  const markersRef = useRef(new Map<string, L.CircleMarker>());
  const selectedSlugRef = useRef<string | null>(null);
  selectedSlugRef.current = selectedArea?.slug ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // React can hand back a node whose previous Leaflet instance never finished
    // tearing down, which makes `L.map` throw "already initialized".
    const staleId = container as unknown as { _leaflet_id?: number };
    if (staleId._leaflet_id !== undefined) {
      delete staleId._leaflet_id;
    }

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
      mapRef.current = null;
      markersRef.current.clear();

      try {
        // `map.remove()` deletes `_mapPane` but leaves `_animatingZoom` set and the
        // 250ms zoom-transition timer armed; when that timer fires it calls
        // `_onZoomTransitionEnd` -> `_move` -> `_getMapPanePos` -> `getPosition(undefined)`
        // and throws "Cannot read properties of undefined (reading '_leaflet_pos')".
        // `_onZoomTransitionEnd` bails out when the flag is false, so clear it here.
        (map as unknown as { _animatingZoom?: boolean })._animatingZoom = false;
        map.remove();
      } catch {
        // The teardown races with React unmount; there is nothing left to release.
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layers = L.layerGroup().addTo(map);
    const markers = markersRef.current;
    markers.clear();
    const selectedSlug = selectedSlugRef.current;
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
        radius: zone.areas.some((area) => area.slug === selectedSlug) ? 12 : 9,
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
      zone.areas.forEach((area) => markers.set(area.slug, marker));
    });

    return () => {
      try {
        layers.remove();
      } catch {
        // Parent map already removed during unmount.
      }
      markers.clear();
    };
  }, [areas, onSelect]);

  // Highlight updates only mutate the marker radius instead of rebuilding every
  // Leaflet layer, which keeps selection instant.
  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      try {
        marker.setRadius(slug === selectedArea?.slug ? 12 : 9);
      } catch {
        // Marker already detached with its map.
      }
    });
  }, [selectedArea]);

  useEffect(() => {
    const map = mapRef.current;
    const positioned = areas.filter((zone) => Number.isFinite(zone.latitude) && Number.isFinite(zone.longitude));
    if (map && positioned.length > 0) {
      const bounds = L.latLngBounds(positioned.map((zone) => [zone.latitude, zone.longitude]));
      // fitBounds pans/zooms with animation by default; during unmount that
      // animation outlives the map. `animate: false` still updates the view.
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12, animate: false });
    }
  }, [areas]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && selectedArea?.centroid_lat && selectedArea.centroid_lng) {
      map.setView(
        [Number(selectedArea.centroid_lat), Number(selectedArea.centroid_lng)],
        Math.max(map.getZoom(), 14),
        { animate: false },
      );
    }
  }, [selectedArea]);

  return <div ref={containerRef} className="relative z-10 h-[375px] w-full rounded-[24px]" />;
}
