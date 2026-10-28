import PageShell from "../components/PageShell";

export default function PeringatanPage() {
  return (
    <PageShell
      eyebrow="Peringatan"
      title="Informasi penting, tepat saat dibutuhkan."
      description="Halaman ini merangkum status peringatan agar Anda dapat menentukan langkah dengan tenang dan cepat."
    >
      <div className="rounded-[28px] border-l-8 border-[#f38a50] bg-white p-7 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f38a50]">Peringatan aktif</p>
        <h2 className="mt-3 text-3xl font-semibold">Waspada hujan lebat</h2>
        <p className="mt-3 leading-8 text-slate-600">Beberapa wilayah berpotensi mengalami peningkatan debit air. Pantau pembaruan dari BPBD dan BMKG.</p>
        <p className="mt-5 text-sm font-semibold text-slate-500">Diperbarui hari ini, 10:30 WIB</p>
      </div>
    </PageShell>
  );
}
