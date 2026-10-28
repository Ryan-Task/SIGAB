import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-[#123d61] px-6 py-12 text-white">
      <div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#82d4d0] font-bold text-[#123d61]">S</span>
            <span className="text-lg font-semibold tracking-[0.12em]">SIGAB</span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-sky-100/70">
            Sistem Informasi Geografis Antisipasi Banjir untuk membantu masyarakat memahami risiko dan mempersiapkan tindakan.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#82d4d0]">Navigasi</h3>
          <div className="mt-4 space-y-3 text-sm text-sky-100/75">
            <Link href="/peta-risiko" className="block transition hover:text-white">Peta Risiko</Link>
            <Link href="/peringatan" className="block transition hover:text-white">Peringatan</Link>
            <Link href="/data-historis" className="block transition hover:text-white">Data Historis</Link>
            <Link href="/mitigasi" className="block transition hover:text-white">Mitigasi</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#82d4d0]">Catatan</h3>
          <p className="mt-4 text-sm leading-7 text-sky-100/70">
            Informasi SIGAB bersifat pendukung. Tetap ikuti arahan resmi BPBD, BMKG, dan instansi berwenang.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-[1180px] border-t border-white/10 pt-5 text-xs text-sky-100/50">
        © 2026 SIGAB. Dibuat untuk mendukung kesiapsiagaan masyarakat.
      </div>
    </footer>
  );
}
