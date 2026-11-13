"use client";

import { useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";
import {
  addUserLocation,
  getAreas,
  getCurrentUser,
  subscribeToPush,
  unsubscribeFromPush,
  getUserLocations,
  removeUserLocation,
  updateProfile,
  updateTwoFactor,
  requestPasswordChangeCode,
  updatePassword,
  type ApiArea,
  type AuthUser,
  type UserLocation,
} from "../../lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [areas, setAreas] = useState<ApiArea[]>([]);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [manualSearch, setManualSearch] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [passwordStep, setPasswordStep] = useState<"idle" | "code">("idle");
  const [passwordCode, setPasswordCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      if (!currentUser) window.location.replace("/login");
      else {
        setUser(currentUser);
        setName(currentUser.name);
      }
    });
    getAreas().then(setAreas);
    getUserLocations().then((saved) => {
      setLocations(saved);
      setShowLocationForm(saved.length === 0);
    }).catch(() => undefined);
    if ("serviceWorker" in navigator && "Notification" in window) {
      navigator.serviceWorker.getRegistration("/sw.js").then((registration) =>
        registration?.pushManager.getSubscription().then((subscription) => {
          setNotificationsEnabled(Boolean(subscription && Notification.permission === "granted"));
        }),
      );
    }
  }, []);

  async function toggleTwoFactor() {
    if (!user) return;
    const updated = await updateTwoFactor(!user.two_factor_enabled);
    setUser(updated);
    setMessage(updated.two_factor_enabled ? "Verifikasi OTP diaktifkan." : "Verifikasi OTP dinonaktifkan.");
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const updated = await updateProfile(name);
    setUser(updated);
    setName(updated.name);
    setMessage("Nama berhasil diperbarui.");
  }

  async function toggleNotifications() {
    setNotificationBusy(true);
    try {
      if (notificationsEnabled) {
        await unsubscribeFromPush();
        setNotificationsEnabled(false);
        setMessage("Notifikasi peringatan dinonaktifkan.");
      } else {
        await subscribeToPush();
        setNotificationsEnabled(true);
        setMessage("Notifikasi peringatan diaktifkan.");
      }

    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notifikasi belum dapat diatur.");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function requestPasswordCode() {
    setPasswordBusy(true);
    try {
      await requestPasswordChangeCode();
      setPasswordStep("code");
      setMessage("Kode OTP perubahan password sudah dikirim ke email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kode OTP belum dapat dikirim.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordBusy(true);
    try {
      await updatePassword(passwordCode, newPassword, newPasswordConfirmation);
      setPasswordStep("idle");
      setPasswordCode("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setMessage("Password berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password belum dapat diperbarui.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function saveLocation(area: ApiArea, source: "gps" | "manual", latitude?: number, longitude?: number, label?: string) {
    setLocationBusy(true);
    try {
      await addUserLocation({ area_id: area.id, label: label?.trim() || area.name, source, latitude, longitude });
      setLocations(await getUserLocations());
      setManualSearch("");
      setSelectedAreaId("");
      setShowLocationForm(false);
      setMessage(`${area.name} ditambahkan ke Daerah Anda.`);
    } finally {
      setLocationBusy(false);
    }

  }

  function useGps() {
    if (!navigator.geolocation) {
      setMessage("Browser ini tidak mendukung GPS.");
      return;
    }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const nearest = areas
          .filter((area) => area.centroid_lat && area.centroid_lng)
          .sort((left, right) => {
            const leftDistance = Math.hypot(Number(left.centroid_lat) - coords.latitude, Number(left.centroid_lng) - coords.longitude);
            const rightDistance = Math.hypot(Number(right.centroid_lat) - coords.latitude, Number(right.centroid_lng) - coords.longitude);
            return leftDistance - rightDistance;
          })[0];
        if (nearest) await saveLocation(nearest, "gps", coords.latitude, coords.longitude);
        else setMessage("Wilayah terdekat belum tersedia.");
        setLocationBusy(false);
      },
      () => {
        setLocationBusy(false);
        setMessage("Lokasi tidak dapat diakses. Izinkan GPS atau pilih daerah secara manual.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function deleteLocation(id: number) {
    await removeUserLocation(id);
    setLocations(await getUserLocations());
    setMessage("Daerah dihapus dari pantauan.");
  }

  const manualCandidates = manualSearch.trim().length < 2
    ? []
    : areas
      .filter((area) => `${area.name} ${area.regency_name ?? ""}`.toLowerCase().includes(manualSearch.trim().toLowerCase()))
      .slice(0, 8);

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />
      <section className="mx-auto min-h-screen max-w-2xl px-6 pb-24 pt-32">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Profil pengguna</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.07em] text-[#123d61]">Akun saya</h1>
        {user && (
          <div className="mt-8 rounded-[28px] bg-white p-7 shadow-[0_24px_60px_rgba(38,102,154,0.12)]">
            <form onSubmit={saveName} className="flex items-end gap-3">
              <label className="block flex-1">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#26669a]">Nama</span>
                <input required minLength={2} maxLength={255} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-xl font-semibold text-[#123d61] outline-none focus:border-[#26669a]" />
              </label>
              <button type="submit" className="rounded-full bg-[#26669a] px-4 py-3 text-sm font-bold text-white">Simpan</button>
            </form>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="font-semibold text-[#123d61]">Ubah password</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Kode OTP akan dikirim ke email sebelum password diganti.</p>
                </div>
                {passwordStep === "idle" && (
                  <button type="button" disabled={passwordBusy} onClick={() => void requestPasswordCode()} className="shrink-0 rounded-full border border-[#26669a] px-4 py-2 text-sm font-bold text-[#26669a] disabled:opacity-50">
                    Kirim OTP
                  </button>
                )}
              </div>
              {passwordStep === "code" && (
                <form onSubmit={savePassword} className="mt-4 space-y-3">
                  <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={passwordCode} onChange={(event) => setPasswordCode(event.target.value)} placeholder="Kode OTP 6 digit" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xl tracking-[0.3em] outline-none focus:border-[#26669a]" />
                  <input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Password baru (minimal 8 karakter)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
                  <input required minLength={8} type="password" value={newPasswordConfirmation} onChange={(event) => setNewPasswordConfirmation(event.target.value)} placeholder="Ulangi password baru" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
                  <button disabled={passwordBusy} className="w-full rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{passwordBusy ? "Menyimpan..." : "Simpan password baru"}</button>
                </form>
              )}
            </div>
            {!user.is_admin && (
              <>
                <div className="mt-8 flex items-center justify-between gap-5 border-t border-slate-100 pt-6">
                  <div>
                    <p className="font-semibold text-[#123d61]">Verifikasi login dengan OTP</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Jika aktif, kode 6 digit akan dikirim ke email setiap login.</p>
                  </div>
                  <button type="button" onClick={toggleTwoFactor} className={`relative h-7 w-12 shrink-0 rounded-full transition ${user.two_factor_enabled ? "bg-[#26669a]" : "bg-slate-300"}`} aria-label="Ubah verifikasi OTP">
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${user.two_factor_enabled ? "left-6" : "left-1"}`} />
                  </button>
                </div>
                <div className="mt-8 flex items-center justify-between gap-5 border-t border-slate-100 pt-6">
                  <div>
                    <p className="font-semibold text-[#123d61]">Notifikasi daerah pantauan</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Terima peringatan saat hujan atau risiko banjir tinggi, termasuk saat website ditutup.</p>
                  </div>
                  <button type="button" disabled={notificationBusy} onClick={() => void toggleNotifications()} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${notificationsEnabled ? "bg-[#26669a]" : "bg-slate-300"}`} aria-label="Ubah notifikasi daerah pantauan">
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${notificationsEnabled ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </>
            )}
            {message && <p className="mt-5 rounded-xl bg-[#dfeaf0] px-4 py-3 text-sm text-[#26669a]">{message}</p>}
          </div>
        )}
        {user && !user.is_admin && (
          <div className="mt-6 rounded-[28px] bg-white p-7 shadow-[0_24px_60px_rgba(38,102,154,0.12)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#26669a]">Daerah pantauan</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#123d61]">Tambahkan daerah Anda</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Gunakan GPS atau pilih wilayah secara manual untuk memantau risiko banjir.</p>
            <button type="button" disabled={locationBusy} onClick={useGps} className="mt-5 w-full rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {locationBusy ? "Mencari lokasi..." : "Gunakan lokasi GPS saya"}
            </button>
            {showLocationForm ? (
              <>
                <select
                  value={selectedAreaId}
                  onChange={(event) => setSelectedAreaId(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-[#123d61]"
                >
                  <option value="">Pilih daerah dari dropdown</option>
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.name}{area.regency_name ? `, ${area.regency_name}` : ""}</option>)}
                </select>
                <button
                  type="button"
                  disabled={!selectedAreaId || locationBusy}
                  onClick={() => {
                    const area = areas.find((item) => String(item.id) === selectedAreaId);
                    if (area) void saveLocation(area, "manual");
                  }}
                  className="mt-3 w-full rounded-xl bg-[#f38a50] px-4 py-3 text-sm font-bold text-[#123d61] disabled:opacity-50"
                >
                  Simpan daerah dari dropdown
                </button>
                <div className="relative mt-4">
                  <input
                    value={manualSearch}
                    onChange={(event) => setManualSearch(event.target.value)}
                    placeholder="Atau ketik alamat/nama daerah..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#123d61] outline-none focus:border-[#26669a]"
                  />
                  {manualCandidates.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      {manualCandidates.map((area) => (
                        <button key={area.id} type="button" disabled={locationBusy} onClick={() => void saveLocation(area, "manual", undefined, undefined, manualSearch)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#123d61] hover:bg-[#dfeaf0] disabled:opacity-50">
                          {area.name}{area.regency_name ? `, ${area.regency_name}` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button type="button" onClick={() => setShowLocationForm(true)} className="mt-5 w-full rounded-full border border-[#26669a] px-5 py-3 text-sm font-bold text-[#26669a]">
                + Tambahkan alamat lagi
              </button>
            )}
            <div className="mt-6 space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between rounded-xl bg-[#dfeaf0] px-4 py-3">
                  <div><p className="font-semibold text-[#123d61]">{location.label ?? location.name}</p><p className="text-xs text-slate-500">{location.source === "gps" ? "Dari GPS" : "Dipilih manual"}</p></div>
                  <button type="button" onClick={() => void deleteLocation(location.id)} className="text-xs font-semibold text-red-600">Hapus</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
