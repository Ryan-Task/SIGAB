"use client";

import { useEffect, useMemo, useState } from "react";
import AdminNav from "../AdminNav";
import { createAdminUser, deleteAdminUser, getAdminUsers, getCurrentUser, setAdminUserBlocked, type AdminUser } from "../../../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Memuat akun pengguna...");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [accountType, setAccountType] = useState<"all" | "users" | "admins">("all");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirmation, setAdminPasswordConfirmation] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);

  async function loadUsers() {
    setUsers(await getAdminUsers());
  }

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user?.is_admin) {
        window.location.replace("/");
        return;
      }
      loadUsers().catch(() => setMessage("Daftar akun belum dapat dimuat."));
    });
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const typeFiltered = accountType === "admins" ? users.filter((user) => user.is_admin) : accountType === "users" ? users.filter((user) => !user.is_admin) : users;
    return normalized
      ? typeFiltered.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(normalized))
      : typeFiltered;
  }, [accountType, query, users]);

  async function submitAdmin(event: React.FormEvent) {
    event.preventDefault();
    setCreatingAdmin(true);
    try {
      const created = await createAdminUser(adminName, adminEmail, adminPassword, adminPasswordConfirmation);
      setUsers((current) => [created, ...current]);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminPasswordConfirmation("");
      setMessage("Administrator baru berhasil ditambahkan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Administrator belum dapat ditambahkan.");
    } finally {
      setCreatingAdmin(false);
    }
  }

  async function toggleBlocked(user: AdminUser) {
    setBusyId(user.id);
    try {
      await setAdminUserBlocked(user.id, !user.is_blocked);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, is_blocked: !item.is_blocked } : item));
      setMessage(user.is_blocked ? "Akun berhasil diaktifkan." : "Akun berhasil diblokir dan token login dicabut.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status akun belum dapat diperbarui.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(user: AdminUser) {
    if (!window.confirm(`Hapus akun ${user.email}? Data akun dan aksesnya akan dihapus.`)) return;
    setBusyId(user.id);
    try {
      await deleteAdminUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setMessage("Akun pengguna berhasil dihapus.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Akun belum dapat dihapus.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <AdminNav />
      <section className="mx-auto min-h-screen max-w-6xl px-5 pb-24 pt-32 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#26669a]">Manajemen pengguna</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#123d61] sm:text-6xl">Atur akun</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Pantau akun pengguna SIGAB, blokir akses yang bermasalah, atau hapus akun yang tidak diperlukan.</p>
        <section className="mt-8 rounded-[28px] bg-white p-5 shadow-[0_20px_45px_rgba(38,102,154,0.1)] sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f38a50]">Daftar akun</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#123d61]">{users.length} akun terdaftar</h2>
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau email..." className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#26669a] sm:max-w-xs" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-[#dfeaf0] p-1.5 text-sm font-bold">
            {[
              ["all", "Semua akun"],
              ["users", "Akun biasa"],
              ["admins", "Administrator"],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setAccountType(value as typeof accountType)} className={`rounded-xl px-4 py-2.5 transition ${accountType === value ? "bg-white text-[#26669a] shadow-sm" : "text-slate-500 hover:text-[#123d61]"}`}>{label}</button>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {filteredUsers.map((user) => (
              <article key={user.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-[#82d4d0] hover:bg-[#f7fbfc] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#dfeaf0] font-black text-[#26669a]">{user.name.slice(0, 1).toUpperCase()}</div>
                  <div>
                    <p className="font-semibold text-[#123d61]">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-400">{user.is_admin ? "Administrator" : user.is_blocked ? "Diblokir" : "Aktif"}</p>
                  </div>
                </div>
                {!user.is_admin && (
                  <div className="flex gap-2">
                    <button type="button" disabled={busyId === user.id} onClick={() => void toggleBlocked(user)} className={`rounded-full px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${user.is_blocked ? "bg-[#dff2ed] text-[#16705f] hover:bg-[#c8e8df]" : "bg-[#fff0e8] text-[#b85522] hover:bg-[#ffdcca]"}`}>
                      {user.is_blocked ? "Aktifkan" : "Blokir"}
                    </button>
                    <button type="button" disabled={busyId === user.id} onClick={() => void removeUser(user)} className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50">Hapus</button>
                  </div>
                )}
              </article>
            ))}
            {filteredUsers.length === 0 && <p className="rounded-xl bg-[#f7fbfc] px-4 py-6 text-center text-sm text-slate-500">Akun yang dicari tidak ditemukan.</p>}
          </div>
          {message && <p className="mt-5 rounded-xl bg-[#dfeaf0] px-4 py-3 text-sm text-[#26669a]">{message}</p>}
        </section>
        <section className="mt-6 rounded-[28px] bg-[#123d61] p-6 text-white shadow-[0_20px_45px_rgba(18,61,97,0.16)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#82d4d0]">Akses administrator</p>
          <h2 className="mt-2 text-2xl font-semibold">Tambahkan administrator</h2>
          <p className="mt-2 text-sm leading-6 text-sky-100/75">Buat akun admin baru untuk membantu memantau dan mengelola SIGAB.</p>
          <button type="button" onClick={() => setShowAdminForm((current) => !current)} className="mt-5 rounded-full bg-[#82d4d0] px-5 py-3 text-sm font-bold text-[#123d61] transition hover:bg-white">
            {showAdminForm ? "Tutup formulir" : "Tambah administrator"}
          </button>
          {showAdminForm && (
            <form onSubmit={submitAdmin} className="mt-6 grid gap-3 sm:grid-cols-2">
              <input required minLength={2} value={adminName} onChange={(event) => setAdminName(event.target.value)} placeholder="Nama lengkap administrator" className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-sky-100/55 focus:border-[#82d4d0]" />
              <input required type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="Email administrator" className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-sky-100/55 focus:border-[#82d4d0]" />
              <input required minLength={8} type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Password minimal 8 karakter" className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-sky-100/55 focus:border-[#82d4d0]" />
              <input required minLength={8} type="password" value={adminPasswordConfirmation} onChange={(event) => setAdminPasswordConfirmation(event.target.value)} placeholder="Ulangi password" className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-sky-100/55 focus:border-[#82d4d0]" />
              <button disabled={creatingAdmin} className="rounded-full bg-[#f38a50] px-5 py-3 text-sm font-bold text-[#123d61] transition hover:bg-[#ffb17e] disabled:opacity-50 sm:col-span-2">{creatingAdmin ? "Menyimpan..." : "Simpan administrator"}</button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}
