import PageShell from "../components/PageShell";

const riskAreas = [
  { name: "Surabaya Barat", status: "Tinggi", value: "68%", color: "bg-[#f38a50]" },
  { name: "Surabaya Selatan", status: "Sedang", value: "44%", color: "bg-[#82d4d0]" },
  { name: "Surabaya Timur", status: "Rendah", value: "22%", color: "bg-[#26669a]" },
];

export default function PetaRisikoPage() {
  return (
    <PageShell
      eyebrow="Peta Risiko"
      title="Pahami wilayah yang perlu lebih diwaspadai."
      description="Peta Risiko SIGAB membantu Anda melihat gambaran potensi banjir berdasarkan wilayah secara ringkas dan mudah dibaca."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="min-h-[460px] rounded-[28px] bg-[#26669a] p-6 shadow-xl">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#82d4d0]">Peta interaktif</p>
              <h2 className="mt-2 text-2xl font-semibold">Surabaya dan sekitarnya</h2>
            </div>
            <span className="rounded-full bg-[#f38a50] px-3 py-1 text-xs font-bold text-slate-900">Waspada</span>
          </div>
          <div className="mt-8 flex h-[330px] items-center justify-center rounded-2xl border border-white/20 bg-[#1f5a88]">
            <p className="text-sm text-sky-100">Area peta akan terhubung dengan data geografis.</p>
          </div>
        </div>
        <div className="space-y-4">
          {riskAreas.map((area) => (
            <article key={area.name} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{area.name}</h3>
                <span className="text-sm font-bold text-[#26669a]">{area.status}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-[#f2e8e3]">
                <div className={`h-2 rounded-full ${area.color}`} style={{ width: area.value }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Indeks risiko {area.value}</p>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
