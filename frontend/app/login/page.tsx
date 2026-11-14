"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";
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
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-28 sm:px-6 sm:py-32">
        <div className="mx-auto grid w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_55px_rgba(18,61,97,0.14)] sm:rounded-[36px] lg:max-w-none lg:grid-cols-[0.9fr_1.1fr] lg:shadow-[0_28px_80px_rgba(18,61,97,0.16)]">
          <div className="relative hidden overflow-hidden bg-[#123d61] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[38px] border-[#82d4d0]/20" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full border-[38px] border-[#f38a50]/25" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">SIGAB</p>
              <h2 className="mt-6 max-w-sm text-5xl font-semibold leading-[0.98] tracking-[-0.08em]">Kenali risiko. Siapkan langkah.</h2>
              <p className="mt-6 max-w-sm text-sm leading-7 text-sky-100/75">Masuk untuk menyimpan daerah pantauan, membaca kondisi wilayah, dan menerima peringatan banjir.</p>
            </div>
            <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5 text-sm leading-7 text-sky-100/80">
              Data risiko banjir, cuaca, dan peringatan wilayah dalam satu tempat.
            </div>
          </div>
          <div className="p-6 sm:p-10 md:p-12 lg:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26669a]">Akun SIGAB</p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.07em] text-[#123d61] sm:text-4xl md:text-5xl">
              {mode === "login" ? "Selamat datang kembali." : mode === "forgot" ? "Pulihkan akses akun." : "Mulai bersama SIGAB."}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
              {mode === "login"
                ? "Masuk untuk melanjutkan pemantauan wilayah Anda."
                : mode === "forgot"
                  ? "Masukkan email akun untuk menerima kode OTP dan membuat password baru."
                  : "Daftar dengan email untuk menyimpan lokasi dan menerima peringatan wilayah."}
            </p>
            <div className="mt-7 grid grid-cols-2 rounded-2xl bg-[#dfeaf0] p-1.5 text-sm font-bold sm:mt-8">
              <button type="button" onClick={() => selectMode("login")} className={`rounded-xl px-4 py-3 transition ${mode === "login" ? "bg-white text-[#26669a] shadow-sm" : "text-slate-500 hover:text-[#123d61]"}`}>Masuk</button>
              <button type="button" onClick={() => selectMode("register")} className={`rounded-xl px-4 py-3 transition ${mode === "register" ? "bg-white text-[#26669a] shadow-sm" : "text-slate-500 hover:text-[#123d61]"}`}>Daftar</button>
            </div>
          {step === "form" ? (
            <form onSubmit={submitEmail} className="mt-7 space-y-4 sm:mt-8">
              {mode === "register" && (
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#26669a]">Nama lengkap</span>
                  <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Masukkan nama lengkap" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#26669a]">Alamat email</span>
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#26669a] focus:ring-4 focus:ring-[#26669a]/10" />
              </label>
              {mode === "login" && email.trim().toLowerCase() === "admin123@gmail.com" && (
                <input required type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Password admin" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#26669a]" />
              )}
              {mode === "login" && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-[#26669a]" />
                  Ingat saya di perangkat ini
                </label>
              )}
              <button disabled={busy} className="w-full rounded-full bg-[#26669a] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(38,102,154,0.2)] transition hover:bg-[#123d61] disabled:opacity-50">
                {busy ? "Memproses..." : mode === "login" ? "Login dengan email" : mode === "forgot" ? "Kirim kode reset" : "Daftar dengan email"}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="mt-8 space-y-4">
              <p className="rounded-xl bg-[#dfeaf0] px-4 py-3 text-sm text-slate-600">Kode dikirim ke <strong>{email}</strong></p>
              <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Masukkan 6 digit kode" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-center text-xl tracking-[0.25em] outline-none focus:border-[#26669a] sm:px-4 sm:text-2xl sm:tracking-[0.4em]" />
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
          <div className="my-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><span className="h-px flex-1 bg-slate-200" />atau<span className="h-px flex-1 bg-slate-200" /></div>
          <a href={`/api/auth/google/redirect?remember=${remember ? "1" : "0"}`} className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 px-5 py-3.5 text-sm font-bold text-[#123d61] transition hover:border-[#26669a] hover:bg-[#dfeaf0]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z" />
              <path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.48-4.03H3.28v2.53A9.74 9.74 0 0 0 12 21.6Z" />
              <path fill="#FBBC05" d="M6.52 13.68A5.86 5.86 0 0 1 6.2 12c0-.58.1-1.15.32-1.68V7.79H3.28A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.21l3.24-2.53Z" />
              <path fill="#EA4335" d="M12 6.29c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.35 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.72 5.39l3.24 2.53c.78-2.31 2.94-4.03 5.48-4.03Z" />
            </svg>
            Lanjutkan dengan Google
          </a>
          {mode === "login" && step === "form" && (
            <button type="button" onClick={() => selectMode("forgot")} className="mt-4 block w-full text-center text-sm font-semibold text-[#26669a]">
              Lupa password?
            </button>
          )}
          {message && <p className="mt-5 rounded-xl bg-[#f0e7e2] px-4 py-3 text-sm text-slate-600">{message}</p>}
          <Link href="/" className="mt-7 block text-center text-sm font-semibold text-[#26669a] transition hover:text-[#123d61]">Kembali ke beranda</Link>
        </div>
        </div>
      </section>
    </main>
  );
}
