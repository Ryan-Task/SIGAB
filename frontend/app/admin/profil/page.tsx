"use client";

import { useEffect, useState } from "react";
import AdminNav from "../AdminNav";
import {
  getCurrentUser,
  requestPasswordChangeCode,
  updatePassword,
  updateProfile,
  type AuthUser,
} from "../../../lib/api";

export default function AdminProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [passwordStep, setPasswordStep] = useState<"idle" | "code">("idle");
  const [passwordCode, setPasswordCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      if (!currentUser) {
        window.location.replace("/login");
        return;
      }
      if (!currentUser.is_admin) {
        window.location.replace("/");
        return;
      }
      setUser(currentUser);
      setName(currentUser.name);
    });
  }, []);

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const updated = await updateProfile(name);
      setUser(updated);
      setName(updated.name);
      setMessage("Nama berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profil belum dapat diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordCode() {
    setBusy(true);
    try {
      await requestPasswordChangeCode();
      setPasswordStep("code");
      setMessage("Kode OTP perubahan password sudah dikirim ke email.");
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
      await updatePassword(passwordCode, newPassword, newPasswordConfirmation);
      setPasswordStep("idle");
      setPasswordCode("");
      setNewPassword("");
      setNewPasswordConfirmation("");
      setMessage("Password berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password belum dapat diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <AdminNav />
      <section className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-32 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#26669a]">Profil administrator</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61] sm:text-6xl">Akun saya</h1>

        <section className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_20px_45px_rgba(38,102,154,0.1)] sm:p-7">
          <form onSubmit={(event) => void saveName(event)}>
            <label htmlFor="admin-name" className="text-xs font-black uppercase tracking-[0.16em] text-[#26669a]">Nama</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#26669a]" />
              <button type="submit" disabled={busy} className="rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123d61] disabled:opacity-50">Simpan</button>
            </div>
            <p className="mt-2 text-sm text-[#50749a]">{user?.email}</p>
          </form>

          <div className="my-7 border-t border-slate-100" />

          {passwordStep === "idle" ? (
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-[#123d61]">Ubah password</p>
                <p className="mt-1 text-sm text-[#50749a]">Kode OTP akan dikirim ke email sebelum password diganti.</p>
              </div>
              <button type="button" disabled={busy} onClick={() => void requestPasswordCode()} className="rounded-full border border-[#26669a] px-5 py-3 text-sm font-bold text-[#26669a] transition hover:bg-[#26669a] hover:text-white disabled:opacity-50">Kirim OTP</button>
            </div>
          ) : (
            <form onSubmit={(event) => void savePassword(event)} className="space-y-3">
              <p className="font-semibold text-[#123d61]">Masukkan OTP dan password baru</p>
              <input value={passwordCode} onChange={(event) => setPasswordCode(event.target.value)} placeholder="Kode OTP" inputMode="numeric" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Password baru" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
              <input type="password" value={newPasswordConfirmation} onChange={(event) => setNewPasswordConfirmation(event.target.value)} placeholder="Ulangi password baru" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
              <button type="submit" disabled={busy} className="rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Simpan password</button>
            </form>
          )}

          {message && <p className="mt-5 text-sm font-semibold text-[#26669a]">{message}</p>}
        </section>
      </section>
    </main>
  );
}
