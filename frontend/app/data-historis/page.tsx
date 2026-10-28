import PageShell from "../components/PageShell";

export default function DataHistorisPage() {
  return (
    <PageShell
      eyebrow="Data Historis"
      title="Belajar dari kejadian yang pernah terjadi."
      description="Data historis membantu melihat pola risiko banjir dari waktu ke waktu sebagai bahan memahami dan merencanakan pencegahan."
    >
      <div className="rounded-[28px] bg-white p-7 shadow-sm">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">Jumlah kejadian banjir</p>
            <p className="mt-2 text-4xl font-semibold text-[#26669a]">42 kejadian</p>
          </div>
          <span className="rounded-full bg-[#82d4d0]/40 px-3 py-1 text-xs font-semibold text-[#26669a]">2021–2025</span>
        </div>
        <div className="mt-8 flex h-48 items-end gap-4 border-b border-slate-200 px-4">
          {[40, 65, 50, 82, 70, 95, 58].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-lg bg-[#26669a]" style={{ height: `${height}%` }} />
              <span className="text-xs text-slate-400">Q{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
