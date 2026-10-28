import PageShell from "../components/PageShell";

const checklist = ["Simpan dokumen dan barang penting di tempat tinggi.", "Kenali jalur evakuasi dan titik berkumpul.", "Pantau informasi resmi dari BPBD atau BMKG.", "Jangan menerobos arus air dengan kendaraan."];

export default function MitigasiPage() {
  return (
    <PageShell
      eyebrow="Mitigasi"
      title="Kesiapsiagaan dimulai dari langkah sederhana."
      description="Ikuti panduan praktis SIGAB untuk mengurangi risiko dan melindungi keluarga sebelum, saat, dan setelah banjir."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {checklist.map((item, index) => (
          <article key={item} className="flex gap-4 rounded-2xl bg-white p-6 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#82d4d0] font-bold text-[#26669a]">{index + 1}</span>
            <p className="leading-7 text-slate-700">{item}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
