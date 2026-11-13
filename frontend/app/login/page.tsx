"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";
import { API_ORIGIN } from "../../lib/api-origin";
import {
  emailLogin,
  adminLogin,
  requestLoginCode,
  requestPasswordResetCode,
  resetPassword,
  persistAuthToken,
  verifyLoginCode,
} from "../../lib/api";

type AuthMode = "login" | "register" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "code">("form");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [remember, setRemember] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const rememberToken = params.get("remember") === "1";
    const error = params.get("error");
    if (token) {
      persistAuthToken(token, rememberToken);
      window.location.replace("/");
    } else if (error) {
      setMessage(error);
    }
  }, []);

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStep("form");
    setCode("");
    setPassword("");
    setPasswordConfirmation("");
    setMessage("");
  }

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login" && email.trim().toLowerCase() === "admin123@gmail.com") {
        await adminLogin(email, adminPassword, remember);
        window.location.replace("/admin");
        return;
      }
      if (mode === "login") {
        const user = await emailLogin(email, remember);
        if (user) {
          window.location.replace("/");
          return;
        }
      }
      if (mode === "forgot") {
        await requestPasswordResetCode(email);
      } else {
        await requestLoginCode(email, mode === "register" ? name : undefined);
      }
      setStep("code");
      setMessage(mode === "register"
        ? "Kode verifikasi pendaftaran sudah dikirim ke email."
        : mode === "forgot"
          ? "Kode OTP reset password sudah dikirim ke email."
          : "Kode verifikasi login sudah dikirim ke email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Permintaan tidak dapat diproses.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "forgot") {
        await resetPassword(email, code, password, passwordConfirmation, remember);
      } else {
        await verifyLoginCode(email, code, mode === "register" ? name : undefined, remember);
      }
      window.location.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kode tidak valid.");
    } finally {
      setBusy(false);
    }
  }

  function changeEmail() {
    setCode("");
    setPassword("");
    setPasswordConfirmation("");
    setMessage("");
    setStep("form");
  }

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />
      <section className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-32">
        <div className="w-full rounded-[32px] bg-white p-8 shadow-[0_24px_60px_rgba(38,102,154,0.14)] sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Akun SIGAB</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#123d61]">
            {mode === "login" ? "Login ke SIGAB" : mode === "forgot" ? "Lupa password" : "Buat akun SIGAB"}
          </h1>
          <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#dfeaf0] p-1 text-sm font-semibold">
            <button type="button" onClick={() => selectMode("login")} className={`rounded-lg px-4 py-2 ${mode === "login" ? "bg-white text-[#26669a] shadow-sm" : "text-slate-500"}`}>Login</button>
            <button type="button" onClick={() => selectMode("register")} className={`rounded-lg px-4 py-2 ${mode === "register" ? "bg-white text-[#26669a] shadow-sm" : "text-slate-500"}`}>Register</button>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {mode === "login"
              ? "Masukkan email akun Anda. Jika OTP aktif, kode akan dikirim ke email."
              : mode === "forgot"
                ? "Masukkan email akun untuk menerima kode OTP dan membuat password baru."
              : "Daftar dengan email untuk menyimpan lokasi dan menerima peringatan wilayah."}
          </p>
          {step === "form" ? (
            <form onSubmit={submitEmail} className="mt-8 space-y-4">
              {mode === "register" && (
                <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama lengkap" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
              )}
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email aktif" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
              {mode === "login" && email.trim().toLowerCase() === "admin123@gmail.com" && (
                <input required type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Password admin" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
              )}
              {mode === "login" && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-[#26669a]" />
                  Ingat saya di perangkat ini
                </label>
              )}
              <button disabled={busy} className="w-full rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {busy ? "Memproses..." : mode === "login" ? "Login dengan email" : mode === "forgot" ? "Kirim kode reset" : "Daftar dengan email"}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="mt-8 space-y-4">
              <p className="rounded-xl bg-[#dfeaf0] px-4 py-3 text-sm text-slate-600">Kode dikirim ke <strong>{email}</strong></p>
              <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Masukkan 6 digit kode" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-[#26669a]" />
              {mode === "forgot" && (
                <>
                  <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password baru (minimal 8 karakter)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
                  <input required minLength={8} type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Ulangi password baru" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
                </>
              )}
              <button disabled={busy} className="w-full rounded-full bg-[#26669a] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Memverifikasi..." : "Lanjutkan"}</button>
              <button type="button" onClick={changeEmail} className="w-full text-sm text-[#26669a]">Ganti email</button>
            </form>
          )}
          <div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />atau<span className="h-px flex-1 bg-slate-200" /></div>
          <a href={`${API_ORIGIN}/api/auth/google/redirect?remember=${remember ? "1" : "0"}`} className="flex w-full items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-[#123d61] transition hover:bg-slate-50">Lanjutkan dengan Google</a>
          {mode === "login" && step === "form" && (
            <button type="button" onClick={() => selectMode("forgot")} className="mt-4 block w-full text-center text-sm font-semibold text-[#26669a]">
              Lupa password?
            </button>
          )}
          {message && <p className="mt-5 rounded-xl bg-[#f0e7e2] px-4 py-3 text-sm text-slate-600">{message}</p>}
          <Link href="/" className="mt-6 block text-center text-sm text-[#26669a]">Kembali ke beranda</Link>
        </div>
      </section>
    </main>
  );
}
