"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import {
  getAdminDashboard,
  getCurrentUser,
  requestPasswordChangeCode,
  updatePassword,
  updateProfile,
  type AdminDashboard,
  type AuthUser,
} from "../../lib/api";

const cards: Array<{ key: keyof AdminDashboard; label: string }> = [
  { key: "users", label: "Pengguna" },
  { key: "areas", label: "Wilayah aktif" },
  { key: "saved_locations", label: "Daerah pantauan" },
  { key: "push_subscriptions", label: "Subscription notifikasi" },
  { key: "risk_predictions", label: "Data skor risiko banjir" },
];

export default function AdminPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [passwordStep, setPasswordStep] = useState<"idle" | "code">("idle");
  const [passwordCode, setPasswordCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Memuat dashboard admin...");

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user?.is_admin) {
        window.location.replace("/");
        return;
      }
      setUser(user);
      setName(user.name);
      getAdminDashboard().then(setData).catch(() => setMessage("Data dashboard admin belum dapat dimuat."));
    });
  }, []);

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const updated = await updateProfile(name);
      setUser(updated);
      setName(updated.name);
      setMessage("Profil administrator diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profil belum dapat diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordCode() {
    setBusy(true);
    try {
      await requestPasswordChangeCode();
      setPasswordStep("code");
      setMessage("Kode OTP perubahan password dikirim ke email administrator.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kode OTP belum dapat dikirim.");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await updatePassword(passwordCode, newPassword, passwordConfirmation);
      setPasswordStep("idle");
      setPasswordCode("");
      setNewPassword("");
      setPasswordConfirmation("");
      setMessage("Password administrator berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password belum dapat diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <AdminNav />
      <section className="mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32">
        <div className="rounded-[32px] bg-[#123d61] p-8 text-white shadow-[0_24px_60px_rgba(18,61,97,0.2)] sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82d4d0]">Administrasi SIGAB</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.07em]">Dashboard Admin</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-sky-100/75">Ringkasan data pengguna, wilayah, notifikasi, dan skor risiko banjir dari database SIGAB.</p>
        </div>
        {data ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <article key={card.key} className="rounded-[28px] border border-[#26669a]/10 bg-white p-7 shadow-[0_18px_40px_rgba(38,102,154,0.1)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#26669a]">{card.label}</p>
                <p className="mt-4 text-5xl font-semibold text-[#123d61]">{data[card.key]}</p>
              </article>
            ))}
          </div>
        ) : <p className="mt-8 rounded-2xl bg-white p-5 text-sm text-slate-600">{message}</p>}
        {user && (
          <section className="mt-8 rounded-[32px] bg-[#f0e7e2] p-8 shadow-[0_18px_40px_rgba(38,102,154,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f38a50]">Profil administrator</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#123d61]">Pengaturan akun</h2>
            <p className="mt-2 text-sm text-slate-600">{user.email}</p>
            <form onSubmit={saveName} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#26669a]">Nama administrator</span>
                <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#123d61] outline-none focus:border-[#26669a]" />
              </label>
              <button disabled={busy} className="rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Simpan nama</button>
            </form>
            <div className="mt-8 border-t border-[#123d61]/10 pt-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-[#123d61]">Ubah password administrator</p>
                  <p className="mt-1 text-sm text-slate-600">Verifikasi dilakukan dengan kode OTP melalui email.</p>
                </div>
                {passwordStep === "idle" && <button type="button" disabled={busy} onClick={() => void sendPasswordCode()} className="rounded-full border border-[#26669a] px-4 py-2 text-sm font-bold text-[#26669a] disabled:opacity-50">Kirim OTP</button>}
              </div>
              {passwordStep === "code" && (
                <form onSubmit={savePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={passwordCode} onChange={(event) => setPasswordCode(event.target.value)} placeholder="Kode OTP 6 digit" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#26669a] sm:col-span-2" />
                  <input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Password baru" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
                  <input required minLength={8} type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Ulangi password baru" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
                  <button disabled={busy} className="rounded-full bg-[#f38a50] px-5 py-3 text-sm font-bold text-[#123d61] disabled:opacity-50 sm:col-span-2">Simpan password baru</button>
                </form>
              )}
            </div>
            {message && <p className="mt-5 rounded-xl bg-white/70 px-4 py-3 text-sm text-[#26669a]">{message}</p>}
          </section>
        )}
        <Link href="/" className="mt-10 inline-flex rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white">Kembali ke beranda</Link>
      </section>
    </main>
  );
}
