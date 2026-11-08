export type ApiArea = {
  id: number;
  name: string;
  slug: string;
  level: string;
  code: string | null;
  regency_code: string | null;
  regency_name: string | null;
  province_code: string | null;
  province_name: string | null;
  centroid_lat: string | null;
  centroid_lng: string | null;
};

export type ApiPrediction = {
  area_id: number;
  name: string;
  slug: string;
  code: string | null;
  regency_code: string | null;
  regency_name: string | null;
  province_code: string | null;
  province_name: string | null;
  score: number | null;
  risk_level: "low" | "medium" | "high" | "insufficient";
  status: string;
  data_as_of: string | null;
  calculated_at: string | null;
  centroid_lat: string | null;
  centroid_lng: string | null;
  weather: {
    rainfall_mm: string | null;
    rainfall_probability: number | string | null;
    observed_at: string | null;
    temperature_c: number | string | null;
    humidity_percent: number | string | null;
    weather_code: number | string | null;
    description: string | null;
  };
  explanation: ApiRiskExplanation | null;
};

export type ApiRiskExplanation = {
  available_components?: string[];
  weights_used?: Record<string, number>;
  confidence?: "limited" | "standard" | string;
  completeness?: "limited" | "standard" | string;
  caveat?: string;
  confidence_reasons?: string[];
  sources?: Record<string, {
    provider: string;
    url: string;
    status: string;
    method?: string;
    elevation_m?: number | null;
    fetched_at?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    response_latitude?: number | null;
    response_longitude?: number | null;
    coordinates_match?: boolean;
    river_distance_m?: number | null;
    river_provider?: string | null;
    river_fetched_at?: string | null;
    environment_components?: Record<string, number | null>;
    drainage_components?: Record<string, number>;
    drainage_component_weights?: Record<string, number>;
    score?: number | null;
    caveat?: string;
  }>;
  [key: string]: unknown;
};

export type ApiRiskPrediction = {
  id: number;
  score: number | null;
  risk_level: "low" | "medium" | "high" | "insufficient";
  rainfall_score: string | null;
  history_score: string | null;
  environment_score: string | null;
  drainage_score: string | null;
  method_version: string;
  data_as_of: string | null;
  calculated_at: string | null;
  status: string;
  explanation: ApiRiskExplanation | null;
};

export type ApiFloodEvent = {
  id: number;
  started_at: string | null;
  ended_at: string | null;
  severity: string | null;
  description: string | null;
  source_reference: string | null;
  verification_status: string;
  area_name: string;
  area_slug: string;
  area_code: string | null;
  regency_code: string | null;
  regency_name: string | null;
  source_name: string | null;
  source_url: string | null;
};

export type ApiFloodHistory = {
  year: number | null;
  regency_code: string | null;
  total: number;
  updated_at: string | null;
  source: string;
  source_url: string;
  events: ApiFloodEvent[];
  monthly: { month: string; count: number }[];
};

type Paginated<T> = { data: T[] };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getAreas(): Promise<ApiArea[]> {
  const response = await getJson<{ data: Paginated<ApiArea> } | { data: ApiArea[] }>("/v1/areas?per_page=100");
  return Array.isArray(response.data) ? response.data : response.data.data;
}

export async function getLatestPredictions(): Promise<ApiPrediction[]> {
  const response = await getJson<{ data: ApiPrediction[] }>("/v1/predictions/latest");
  return response.data;
}

export async function getAreaRisk(slug: string): Promise<{ area: ApiArea; prediction: ApiRiskPrediction | null }> {
  const response = await getJson<{ data: { area: ApiArea; prediction: ApiRiskPrediction | null } }>(
    `/v1/areas/${encodeURIComponent(slug)}/risk`,
  );
  return response.data;
}

export async function getAreaRainfall(slug: string): Promise<Paginated<{
  observed_at: string;
  period_hours: number | null;
  rainfall_mm: string | null;
  rainfall_probability: number | string | null;
  quality_status: string;
}>> {
  const response = await getJson<{ data: Paginated<{
    observed_at: string;
    period_hours: number | null;
    rainfall_mm: string | null;
    rainfall_probability: number | string | null;
    quality_status: string;
  }> }>(`/v1/areas/${encodeURIComponent(slug)}/rainfall?per_page=100`);
  return response.data;
}

export async function getFloodHistory(): Promise<ApiFloodHistory> {
  const response = await getJson<{ data: ApiFloodHistory }>("/v1/flood-events");
  return response.data;
}

export async function getFloodEventYears(): Promise<number[]> {
  const response = await getJson<{ data: number[] }>("/v1/flood-events/years");
  return response.data;
}

export async function getFloodHistoryByYear(year: number, regencyCode?: string): Promise<ApiFloodHistory> {
  const params = new URLSearchParams({ year: String(year) });
  if (regencyCode) params.set("regency_code", regencyCode);
  const response = await getJson<{ data: ApiFloodHistory }>(`/v1/flood-events?${params.toString()}`);
  return response.data;
}
