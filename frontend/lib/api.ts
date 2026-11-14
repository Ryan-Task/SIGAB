import { API_ORIGIN } from "./api-origin";

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
  current_weather_score?: number | null;
  realtime_calculated_at?: string | null;
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
    peak_mm?: number | null;
    accumulated_mm?: number | null;
    wet_slots?: number | null;
    rain_start_at?: string | null;
    rain_end_at?: string | null;
    rain_duration_hours?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    response_latitude?: number | null;
    response_longitude?: number | null;
    coordinates_match?: boolean;
    river_distance_m?: number | null;
    river_provider?: string | null;
    river_fetched_at?: string | null;
    nearest_drainage_distance_m?: number | null;
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
  current_weather_score?: number | null;
  realtime_calculated_at?: string | null;
  risk_level: "low" | "medium" | "high" | "insufficient";
  rainfall_score: string | null;
  history_score: string | null;
  history_count: number | null;
  history_frequency: "sering" | "terkadang" | "jarang" | null;
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

export type ApiHistorySummary = {
  regency_code: string | null;
  area_count: number;
  rainfall: {
    record_count: number;
      rain_record_count: number;
      wet_day_count: number;
      total_mm: number;
    avg_mm_per_area: number;
    from: string | null;
    to: string | null;
    daily: { day: string; records: number; total_mm: number; avg_mm: number; areas: number }[];
    hourly: { hour: number; records: number; total_mm: number; avg_mm: number }[];
    districts: { district_code: string; areas: number; records: number; total_mm: number; avg_mm: number }[];
  };
  risk: {
    calculated_at: string | null;
    avg_score: number;
    min_score: number;
    max_score: number;
    levels: { level: string; count: number }[];
    score_distribution: { bucket: string; count: number }[];
    components: { key: string; label: string; avg: number }[];
    districts: { district_code: string; areas: number; avg_score: number; max_score: number; medium_count: number }[];
    regencies: { regency_code: string; regency_name: string; areas: number; total_mm: number; avg_score: number; medium_count: number }[];
    top_areas: {
      area_name: string;
      area_slug: string;
      area_code: string | null;
      district_code: string | null;
      regency_code: string | null;
      score: number;
      risk_level: string;
      rainfall_score: number;
      history_score: number;
      environment_score: number;
      drainage_score: number;
    }[];
  };
  source: { rainfall: string; risk: string };
  updated_at: string | null;
};

type Paginated<T> = { data: T[] };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";

// Server-side rendering cannot resolve a relative `/api` URL, so fall back to
// the same origin the rewrite proxies to.
function apiUrl(path: string): string {
  if (/^https?:\/\//.test(apiBaseUrl)) return `${apiBaseUrl}${path}`;
  if (typeof window === "undefined") return `${API_ORIGIN}${apiBaseUrl}${path}`;
  return `${apiBaseUrl}${path}`;
}

const FETCH_TIMEOUT_MS = 10_000;
const AUTH_FETCH_TIMEOUT_MS = 45_000;
const PUSH_FETCH_TIMEOUT_MS = 60_000;
// /v1/areas/{slug}/risk recomputes the score from an upstream weather provider.
// The Laravel dev server handles one request at a time, so a batch of risk
// calls queues up and easily outlives the default timeout. Give it more room.
const RISK_FETCH_TIMEOUT_MS = 30_000;

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

async function getJson<T>(
  path: string,
  initOrTimeout?: RequestInit | number,
  timeoutOverrideMs?: number,
): Promise<T> {
  const init = typeof initOrTimeout === "number" ? {} : (initOrTimeout ?? {});
  const timeoutMs = timeoutOverrideMs ?? (typeof initOrTimeout === "number" ? initOrTimeout : undefined);
  let response: Response;
  try {
    response = await fetchWithTimeout(apiUrl(path), { cache: "no-store", ...init }, timeoutMs);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Permintaan ke server terlalu lama. Silakan coba lagi.");
    }
    throw error;
  }
  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const body = await response.json() as { message?: unknown };
      if (typeof body.message === "string" && body.message.trim() !== "") message = body.message;
    } catch {
      // Keep the HTTP status when the server does not return JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function getAreas(): Promise<ApiArea[]> {
  const response = await getJson<{ data: Paginated<ApiArea> } | { data: ApiArea[] }>("/v1/areas?per_page=100");
  return Array.isArray(response.data) ? response.data : response.data.data;
}

export type AuthUser = { id: number; name: string; email: string; two_factor_enabled: boolean; is_admin: boolean; has_locations: boolean };
export type UserLocation = {
  id: number;
  area_id: number;
  label: string | null;
  latitude: string | null;
  longitude: string | null;
  source: "gps" | "manual";
  name: string;
  slug: string;
  regency_name: string | null;
  centroid_lat: string | null;
  centroid_lng: string | null;
};
const AUTH_TOKEN_KEY = "sigab_auth_token";

function authHeaders(): HeadersInit {
  const token = typeof window === "undefined"
    ? null
    : localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function persistAuthToken(token: string, remember = false): void {
  if (remember) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export async function requestLoginCode(email: string, password: string, mode: "login" | "register", name?: string): Promise<void> {
  await getJson<void>("/auth/request-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password, mode }),
  }, AUTH_FETCH_TIMEOUT_MS);
}

export async function emailLogin(email: string, password: string, remember = false): Promise<AuthUser | null> {
  const response = await getJson<{ data?: { user: AuthUser; token: string }; requires_verification?: boolean }>("/auth/email-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (response.requires_verification) return null;
  if (!response.data) throw new Error("Respons login tidak valid.");
  persistAuthToken(response.data.token, remember);
  return response.data.user;
}

export async function adminLogin(email: string, password: string, remember = false): Promise<AuthUser> {
  const response = await getJson<{ data: { user: AuthUser; token: string } }>("/auth/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  persistAuthToken(response.data.token, remember);
  return response.data.user;
}

export type AdminDashboard = {
  users: number;
  areas: number;
  saved_locations: number;
  push_subscriptions: number;
  risk_predictions: number;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
};

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const response = await getJson<{ data: AdminDashboard }>("/admin/dashboard", { headers: authHeaders() });
  return response.data;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await getJson<{ data: AdminUser[] }>("/admin/users", { headers: authHeaders() });
  return response.data;
}

export async function createAdminUser(name: string, email: string, password: string, passwordConfirmation: string): Promise<AdminUser> {
  const response = await getJson<{ data: AdminUser }>("/admin/users/admin", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
  });
  return response.data;
}

export async function setAdminUserBlocked(userId: number, blocked: boolean): Promise<void> {
  await getJson(`/admin/users/${userId}/block`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ blocked }),
  });
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await getJson(`/admin/users/${userId}`, { method: "DELETE", headers: authHeaders() });
}

export async function importAdminHistory(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await getJson<{ message: string }>("/admin/history/import", {
    method: "POST",
    headers: authHeaders(),
    body,
  });
  return response.message;
}

export async function verifyLoginCode(email: string, code: string, name?: string, remember = false): Promise<AuthUser> {
  const response = await getJson<{ data: { user: AuthUser; token: string } }>("/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, name }),
  });
  persistAuthToken(response.data.token, remember);
  return response.data.user;
}

export async function requestPasswordResetCode(email: string): Promise<void> {
  await getJson<void>("/auth/password/forgot-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }, AUTH_FETCH_TIMEOUT_MS);
}

export async function resetPassword(email: string, code: string, password: string, passwordConfirmation: string, remember = false): Promise<AuthUser> {
  const response = await getJson<{ data: { user: AuthUser; token: string } }>("/auth/password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, password, password_confirmation: passwordConfirmation }),
  }, AUTH_FETCH_TIMEOUT_MS);
  persistAuthToken(response.data.token, remember);
  return response.data.user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await getJson<{ data: AuthUser }>("/auth/me", { headers: authHeaders() });
    return response.data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await getJson<void>("/auth/logout", { method: "POST", headers: authHeaders() });
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function updateTwoFactor(enabled: boolean): Promise<AuthUser> {
  const response = await getJson<{ data: AuthUser }>("/auth/settings", {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ two_factor_enabled: enabled }),
  });
  return response.data;
}

export async function requestPasswordChangeCode(): Promise<void> {
  await getJson<void>("/auth/password/change-code", {
    method: "POST",
    headers: authHeaders(),
  }, AUTH_FETCH_TIMEOUT_MS);
}

export async function updatePassword(code: string, password: string, passwordConfirmation: string): Promise<void> {
  await getJson<void>("/auth/password", {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ code, password, password_confirmation: passwordConfirmation }),
  }, AUTH_FETCH_TIMEOUT_MS);
}

export async function updateProfile(name: string): Promise<AuthUser> {
  const response = await getJson<{ data: AuthUser }>("/auth/profile", {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return response.data;
}

export async function getUserLocations(): Promise<UserLocation[]> {
  const response = await getJson<{ data: UserLocation[] }>("/auth/locations", { headers: authHeaders() });
  return response.data;
}

export async function addUserLocation(input: {
  area_id: number;
  label?: string;
  latitude?: number;
  longitude?: number;
  source: "gps" | "manual";
}): Promise<void> {
  await getJson<void>("/auth/locations", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function removeUserLocation(id: number): Promise<void> {
  await getJson<void>(`/auth/locations/${id}`, { method: "DELETE", headers: authHeaders() });
}

export async function getPushPublicKey(): Promise<string | null> {
  const response = await getJson<{ data: { public_key: string | null; configured: boolean } }>("/auth/push/public-key", PUSH_FETCH_TIMEOUT_MS);
  return response.data.configured ? response.data.public_key : null;
}

export async function subscribeToPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Browser ini belum mendukung notifikasi push. Di iPhone, tambahkan SIGAB ke Home Screen terlebih dahulu.");
  }
  const publicKey = await getPushPublicKey();
  if (!publicKey) throw new Error("Notifikasi belum dikonfigurasi di server.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Izin notifikasi tidak diberikan.");
  const registration = await navigator.serviceWorker.register("/sw.js");
  const existingSubscription = await registration.pushManager.getSubscription();
  const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
  const subscription = existingSubscription ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: Uint8Array.from(
      atob(`${publicKey.replace(/-/g, "+").replace(/_/g, "/")}${padding}`),
      (char) => char.charCodeAt(0),
    ),
  });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Subscription notifikasi tidak lengkap.");
  await getJson<void>("/auth/push/subscribe", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  }, PUSH_FETCH_TIMEOUT_MS);
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await getJson<void>("/auth/push/subscribe", {
    method: "DELETE",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }, PUSH_FETCH_TIMEOUT_MS);
  await subscription.unsubscribe();
}

export async function getLatestPredictions(): Promise<ApiPrediction[]> {
  const response = await getJson<{ data: ApiPrediction[] }>("/v1/predictions/latest");
  return response.data;
}

export async function getAreaRisk(slug: string): Promise<{ area: ApiArea; prediction: ApiRiskPrediction | null }> {
  const response = await getJson<{ data: { area: ApiArea; prediction: ApiRiskPrediction | null } }>(
    `/v1/areas/${encodeURIComponent(slug)}/risk`,
    RISK_FETCH_TIMEOUT_MS,
  );
  return response.data;
}

type AreaRiskResult = { area: ApiArea; prediction: ApiRiskPrediction | null };

// In-memory cache for getAreaRisk so the wilayah detail page does not refetch
// the same slug while navigating. The backend serves every score from one
// shared district weather snapshot, so no cross-page override is needed.
const riskCache = new Map<string, { data: AreaRiskResult; expiresAt: number }>();
const riskInFlight = new Map<string, Promise<AreaRiskResult>>();
const RISK_CACHE_TTL_MS = 300_000;

export function getCachedAreaRisk(slug: string): Promise<AreaRiskResult> {
  const cached = riskCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }
  // Share one request per slug: concurrent callers (map zones, alert list,
  // detail panel) must not each pay the per-area upstream latency.
  const inFlight = riskInFlight.get(slug);
  if (inFlight !== undefined) {
    return inFlight;
  }
  const request = getAreaRisk(slug)
    .then((data) => {
      riskCache.set(slug, { data, expiresAt: Date.now() + RISK_CACHE_TTL_MS });
      return data;
    })
    .catch((error: unknown) => {
      // A refresh that fails should not blank out a stale score we already hold.
      if (cached !== undefined) return cached.data;
      throw error;
    })
    .finally(() => {
      riskInFlight.delete(slug);
    });
  riskInFlight.set(slug, request);
  return request;
}

export function invalidateRiskCache(slug?: string): void {
  if (slug === undefined) {
    riskCache.clear();
    riskInFlight.clear();
    return;
  }
  riskCache.delete(slug);
  riskInFlight.delete(slug);
}

export type ApiEnvironmentDataset = {
  category: string;
  title: string;
  provider: string;
  url: string;
  format: string;
  coverage: string;
  year: string;
  status: "reachable" | "unreachable" | "invalid_url";
  http_status: number | null;
  reason: string | null;
};

export type ApiEnvironmentDiscovery = {
  area: { name: string; regency_name: string | null; province_name: string | null };
  summary: string | null;
  datasets: ApiEnvironmentDataset[];
  searched_at: string;
  grounded: boolean;
  disclaimer: string;
};

export async function discoverEnvironmentData(slug: string): Promise<ApiEnvironmentDiscovery> {
  const response = await getJson<{ data: ApiEnvironmentDiscovery }>(
    `/v1/areas/${encodeURIComponent(slug)}/environment-discovery`,
  );
  return response.data;
}

export type ApiRainfallRecord = {
  observed_at: string;
  period_hours: number | null;
  rainfall_mm: string | null;
  rainfall_probability: number | string | null;
  weather_code: number | string | null;
  weather_description: string | null;
  fetched_at: string | null;
  quality_status: string;
};

export async function getAreaRainfall(slug: string): Promise<Paginated<ApiRainfallRecord>> {
  const response = await getJson<{ data: Paginated<ApiRainfallRecord> }>(
    `/v1/areas/${encodeURIComponent(slug)}/rainfall?per_page=8`,
  );
  return response.data;
}

export type ApiCurrentWeather = {
  provider: string;
  source_type: string;
  fetched_at: string;
  current: {
    time: string | null;
    precipitation_mm: number;
    rain_mm: number;
    showers_mm: number;
    weather_code: number | null;
    is_raining: boolean;
    rain_score: number;
  };
  rain_window: {
    start_at: string | null;
    end_at: string | null;
    duration_hours: number;
  };
};

export async function getAreaCurrentWeather(slug: string): Promise<ApiCurrentWeather> {
  const response = await getJson<{ data: ApiCurrentWeather }>(
    `/v1/areas/${encodeURIComponent(slug)}/current-weather`,
  );
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

export async function getHistorySummary(regencyCode?: string): Promise<ApiHistorySummary> {
  const params = regencyCode ? `?regency_code=${encodeURIComponent(regencyCode)}` : "";
  const response = await getJson<{ data: ApiHistorySummary }>(`/v1/history/summary${params}`);
  return response.data;
}
