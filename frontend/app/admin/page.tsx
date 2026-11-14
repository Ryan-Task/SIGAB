"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import { getAdminDashboard, getCurrentUser, type AdminDashboard } from "../../lib/api";

const cards: Array<{ key: keyof AdminDashboard; label: string; detail: string; accent: string }> = [
  { key: "users", label: "Pengguna terdaftar", detail: "Akun yang tersimpan di SIGAB", accent: "bg-[#dfeaf0]" },
  { key: "areas", label: "Wilayah aktif", detail: "Wilayah yang tersedia untuk dipantau", accent: "bg-[#dff2ed]" },
  { key: "saved_locations", label: "Daerah pantauan", detail: "Lokasi yang disimpan pengguna", accent: "bg-[#fff0e8]" },
  { key: "push_subscriptions", label: "Notifikasi aktif", detail: "Subscription Web Push tersimpan", accent: "bg-[#ece8f8]" },
  { key: "risk_predictions", label: "Data risiko banjir", detail: "Prediksi yang tersedia di sistem", accent: "bg-[#e6f0f8]" },
];

export default function AdminPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [message, setMessage] = useState("Memuat ringkasan dashboard...");

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user?.is_admin) {
        window.location.replace("/");
        return;
      }
      getAdminDashboard().then(setData).catch(() => setMessage("Data dashboard belum dapat dimuat."));
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <AdminNav />
      <section className="mx-auto min-h-screen max-w-6xl px-5 pb-24 pt-32 sm:px-6">
        <div className="relative overflow-hidden rounded-[32px] bg-[#123d61] p-8 text-white shadow-[0_24px_60px_rgba(18,61,97,0.2)] sm:p-11">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[42px] border-[#82d4d0]/20" />
          <div className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full border-[42px] border-[#f38a50]/20" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Pusat informasi SIGAB</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.07em] sm:text-6xl">Pantau sistem dengan lebih jelas.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-sky-100/75">
              Ringkasan pengguna, wilayah, notifikasi, dan data skor risiko banjir yang tersimpan di database SIGAB.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold">
              <Link href="/admin/riwayat" className="rounded-full bg-[#82d4d0] px-5 py-3 text-[#123d61] transition hover:bg-white">Lihat riwayat</Link>
              <Link href="/admin/akun" className="rounded-full border border-white/25 px-5 py-3 text-white transition hover:border-[#82d4d0] hover:bg-white/10">Atur akun</Link>
            </div>
          </div>
        </div>

        {data ? (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <article key={card.key} className={`rounded-[26px] border border-white/80 ${card.accent} p-6 shadow-[0_16px_34px_rgba(38,102,154,0.09)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(38,102,154,0.15)]`}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#26669a]">{card.label}</p>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f38a50]" />
                  </div>
                  <p className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#123d61]">{data[card.key]}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.detail}</p>
                </article>
              ))}
            </div>
            <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-[28px] bg-white p-7 shadow-[0_18px_40px_rgba(38,102,154,0.1)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f38a50]">Gambaran sistem</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#123d61]">Semua data utama dalam satu tampilan</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">Gunakan menu Atur akun untuk mengelola profil administrator, dan Riwayat untuk melihat ringkasan data yang tersimpan.</p>
              </article>
              <article className="rounded-[28px] bg-[#f0e7e2] p-7 shadow-[0_18px_40px_rgba(38,102,154,0.08)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#26669a]">Status layanan</p>
                <p className="mt-3 text-2xl font-semibold text-[#123d61]">Sistem aktif</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Dashboard terhubung ke database SIGAB.</p>
              </article>
            </section>
          </>
        ) : (
          <p className="mt-8 rounded-2xl bg-white p-5 text-sm text-slate-600">{message}</p>
        )}
      </section>
    </main>
  );
}
