import PageShell from "../../components/PageShell";

export function generateStaticParams() {
  return [{ slug: "surabaya" }];
}

export default async function WilayahPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wilayah = slug.replaceAll("-", " ");

  return (
    <PageShell
      eyebrow="Detail Wilayah"
      title={`Informasi risiko ${wilayah}.`}
      description="Kenali kondisi wilayah, faktor risiko, dan rekomendasi yang dapat dilakukan untuk menjaga keselamatan bersama."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ["Status risiko", "Waspada", "text-[#f38a50]"],
          ["Curah hujan", "72 mm", "text-[#26669a]"],
          ["Ketinggian", "5 mdpl", "text-[#26669a]"],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-3 text-3xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[28px] bg-white p-7 shadow-sm">
        <h2 className="text-2xl font-semibold">Yang perlu diperhatikan</h2>
        <p className="mt-3 leading-8 text-slate-600">Perhatikan informasi resmi cuaca, hindari jalur dengan genangan tinggi, dan siapkan kebutuhan penting di tempat yang lebih tinggi.</p>
      </div>
    </PageShell>
  );
}
