"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import SiteNav from "./components/SiteNav";

const featureStories = [
  {
    label: "01 / Peta",
    title: "Lihat wilayah dengan cara yang lebih sederhana.",
    description:
      "Peta Risiko menyajikan gambaran wilayah rawan tanpa membuat pengguna harus memahami istilah teknis yang rumit.",
    href: "/peta-risiko",
    accent: "bg-[#26669a]",
  },
  {
    label: "02 / Data",
    title: "Pahami angka di balik setiap peringatan.",
    description:
      "Curah hujan, riwayat kejadian, dan faktor lingkungan disusun sebagai konteks agar keputusan terasa lebih masuk akal.",
    href: "/data-historis",
    accent: "bg-[#f38a50]",
  },
  {
    label: "03 / Mitigasi",
    title: "Tahu apa yang bisa dilakukan berikutnya.",
    description:
      "Setiap informasi diarahkan menjadi langkah praktis yang dapat dilakukan oleh keluarga dan masyarakat.",
    href: "/mitigasi",
    accent: "bg-[#82d4d0]",
  },
];

const tickerItems = [
  "Peta Risiko",
  "Peringatan Wilayah",
  "Data Historis",
  "Panduan Mitigasi",
  "Informasi Terbuka",
];

const journey = [
  {
    number: "01",
    title: "Kenali",
    text: "Mulai dari gambaran wilayah dan kondisi yang sedang terjadi.",
  },
  {
    number: "02",
    title: "Pahami",
    text: "Baca faktor yang memengaruhi risiko dengan bahasa yang mudah.",
  },
  {
    number: "03",
    title: "Siapkan",
    text: "Gunakan panduan untuk mengambil tindakan dengan lebih tenang.",
  },
];

const faqs = [
  {
    question: "Apa itu SIGAB?",
    answer:
      "SIGAB (Sistem Informasi Geografis Antisipasi Banjir) adalah sistem informasi berbasis geografis yang membantu pengguna mengetahui informasi potensi risiko banjir melalui peta dan data pendukung.",
  },
  {
    question: "Bagaimana cara melihat risiko banjir di suatu wilayah?",
    answer:
      "Buka halaman peta risiko banjir, cari nama wilayah yang diinginkan melalui fitur pencarian jika tersedia, kemudian pilih wilayah tersebut untuk melihat informasi risikonya.",
  },
  {
    question: "Apakah SIGAB mencakup seluruh wilayah Indonesia?",
    answer:
      "SIGAB dirancang untuk mencakup seluruh wilayah yang didukung oleh sistem. Ketersediaan informasi pada setiap wilayah bergantung pada data yang tersedia dan telah diintegrasikan.",
  },
  {
    question: "Apakah informasi risiko banjir di SIGAB selalu akurat dan terbaru?",
    answer:
      "Informasi SIGAB bergantung pada sumber, kelengkapan, dan waktu pembaruan data. Oleh karena itu, informasi yang ditampilkan sebaiknya digunakan sebagai pendukung dan dibandingkan dengan informasi resmi dari instansi terkait.",
  },
  {
    question: "Apa yang harus dilakukan jika wilayah saya berpotensi mengalami banjir?",
    answer:
      "Pantau informasi dan peringatan dari instansi resmi, siapkan kebutuhan darurat, hindari daerah berbahaya, serta ikuti arahan petugas apabila terdapat instruksi evakuasi.",
  },
];

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeStory, setActiveStory] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const nextSoundState = video.muted;
    video.muted = !nextSoundState;
    setSoundEnabled(nextSoundState);

    if (video.paused) {
      await video.play();
    }
  };

  const story = featureStories[activeStory];

  const handleStoryDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } },
  ) => {
    const swipeThreshold = 70;

    if (info.offset.x < -swipeThreshold) {
      setActiveStory((current) => Math.min(current + 1, featureStories.length - 1));
    } else if (info.offset.x > swipeThreshold) {
      setActiveStory((current) => Math.max(current - 1, 0));
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#dfeaf0] text-slate-800">
      <SiteNav />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden bg-slate-950"
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/banjir.jpg')" }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,18,28,0.68)_0%,rgba(5,18,28,0.38)_42%,rgba(3,14,23,0.78)_100%)]" />
        <motion.div
          animate={{ x: [0, 28, 0], scaleX: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 left-[-10%] h-52 w-[120%] rounded-[50%] bg-[#26669a]/30 blur-2xl"
        />
        <motion.div
          animate={{ x: [0, -22, 0], scaleX: [1.05, 1, 1.05] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-[-10%] h-48 w-[120%] rounded-[50%] bg-[#82d4d0]/20 blur-xl"
        />

        <div className="relative z-10 px-6 text-center text-white">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#82d4d0]"
          >
            Sistem Informasi Geografis Anti Banjir
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-6xl font-semibold tracking-[-0.08em] drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)] sm:text-8xl lg:text-[9rem]"
          >
            SIGAB
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/85 sm:text-base"
          >
            Antisipasi peluapan dengan informasi yang jelas, cepat, dan mudah dipahami.
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            href="#video"
            className="mt-8 inline-flex rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#26669a]"
          >
            Jelajahi SIGAB
          </motion.a>
        </div>

        <a
          href="#video"
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/70"
        >
          <span>Scroll</span>
          <motion.span
            animate={{ y: [0, 8, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-px bg-white/60"
          />
        </a>
      </motion.section>

      <section id="video" className="bg-[#dfeaf0] px-6 py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#26669a]">Lihat situasinya</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.07em] text-[#123d61] sm:text-6xl">
              Banjir bukan sekadar angka.
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-slate-600">
              SIGAB menerjemahkan kondisi lapangan menjadi informasi yang membantu Anda mengenali risiko dan menyiapkan langkah berikutnya.
            </p>
            <Link href="/peta-risiko" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#26669a] transition hover:text-[#f38a50]">
              Lihat peta risiko <span aria-hidden="true">↗</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="relative h-[430px] overflow-hidden rounded-[32px] bg-slate-900 shadow-[0_30px_70px_rgba(18,61,97,0.2)] sm:h-[560px]"
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              src="/video.mp4"
              poster="/banjir.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Video pengenalan kondisi banjir"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071c2b]/75 via-transparent to-[#071c2b]/10" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
              <p className="max-w-xs text-sm leading-6 text-white/80">
                Gambaran kondisi banjir yang menjadi alasan mengapa kesiapsiagaan penting.
              </p>
              <button
                type="button"
                onClick={toggleSound}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f38a50] text-slate-900 shadow-lg transition hover:bg-[#ff9d67]"
                aria-label={soundEnabled ? "Matikan suara video" : "Nyalakan suara video"}
              >
                {soundEnabled ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                    <path d="M4 10v4h3l5 4V6l-5 4H4Z" fill="currentColor" />
                    <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                    <path d="M4 10v4h3l5 4V6l-5 4H4Z" fill="currentColor" />
                    <path d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="intro" className="bg-[#f0e7e2] px-6 py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#26669a]">Tentang SIGAB</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.07em] text-[#123d61] sm:text-6xl">
              Informasi yang membuat kita lebih siap.
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.12, duration: 0.6 }}
            className="border-l-2 border-[#f38a50] pl-6 text-base leading-8 text-slate-600 sm:pl-10"
          >
            <p>
              SIGAB adalah Sistem Informasi Geografis Antisipasi Banjir yang membantu masyarakat memahami estimasi risiko banjir per wilayah melalui peta, data pendukung, dan panduan yang sederhana.
            </p>
            <p className="mt-5">
              Bukan untuk menakut-nakuti, tetapi untuk memberi waktu. Kenali kondisi, pahami risikonya, lalu tentukan langkah yang paling aman.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-[#26669a]/10 bg-[#82d4d0] py-5 text-[#123d61]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="flex w-max items-center gap-8 whitespace-nowrap"
        >
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-8 text-sm font-bold uppercase tracking-[0.16em]">
              <span>{item}</span>
              <span className="text-xl text-[#f38a50]">✳</span>
            </div>
          ))}
        </motion.div>
      </section>

      <section id="services" className="bg-[#dfeaf0] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#26669a]">Jelajahi SIGAB</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.07em] text-[#123d61] sm:text-6xl">
                Pilih informasi yang Anda butuhkan.
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-slate-500 sm:inline">Geser panel</span>
              <div className="flex gap-2">
              {featureStories.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveStory(index)}
                  className={`h-3 rounded-full transition-all ${index === activeStory ? "w-10 bg-[#f38a50]" : "w-3 bg-[#26669a]/30"}`}
                  aria-label={`Buka fitur ${index + 1}`}
                />
              ))}
              </div>
            </div>
          </div>

          <motion.div
            key={story.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={handleStoryDragEnd}
            whileTap={{ cursor: "grabbing" }}
            className="mt-12 grid min-h-[360px] cursor-grab touch-pan-y gap-8 overflow-hidden rounded-[32px] bg-[#123d61] text-white lg:grid-cols-[0.8fr_1.2fr]"
          >
            <div className={`flex min-h-[260px] flex-col justify-between p-8 ${story.accent}`}>
              <span className="text-sm font-bold uppercase tracking-[0.18em]">{story.label}</span>
              <span className="text-[8rem] font-semibold leading-none tracking-[-0.12em] text-white/20">
                {String(activeStory + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <h3 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.06em] sm:text-5xl">{story.title}</h3>
              <p className="mt-5 max-w-lg text-base leading-8 text-sky-100/75">{story.description}</p>
              <Link href={story.href} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#82d4d0] transition hover:text-[#f38a50]">
                Jelajahi fitur <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="panduan" className="bg-[#f0e7e2] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f38a50]">Panduan pengguna</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-[#123d61] sm:text-6xl">
                Tidak perlu menebak. Ikuti langkahnya.
              </h2>
            </div>
            <div className="flex items-end justify-between gap-6 border-l-2 border-[#26669a] pl-6 sm:pl-10">
              <p className="max-w-xl text-base leading-8 text-slate-600">
                Pelajari cara membaca peta, memahami status risiko, dan menggunakan informasi SIGAB dengan panduan pengguna yang sudah disiapkan.
              </p>
              <span className="hidden text-5xl font-semibold tracking-[-0.1em] text-[#26669a]/20 sm:block">PDF</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mt-14 grid overflow-hidden rounded-[32px] bg-[#123d61] shadow-[0_24px_60px_rgba(18,61,97,0.18)] lg:grid-cols-[0.7fr_1.3fr]"
          >
            <div className="relative min-h-[340px] overflow-hidden bg-[#26669a] p-8 text-white sm:p-10">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[38px] border-[#82d4d0]/25" />
              <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full border-[30px] border-[#f38a50]/25" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <span className="rounded-full border border-white/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#82d4d0]">
                    Panduan resmi SIGAB
                  </span>
                  <h3 className="mt-8 max-w-xs text-4xl font-semibold leading-tight tracking-[-0.07em]">
                    Kenali. Pahami. Siapkan.
                  </h3>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-sm text-sky-100/70">Edisi pengguna</span>
                  <span className="text-7xl font-semibold leading-none tracking-[-0.12em] text-white/20">01</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between p-8 text-white sm:p-10">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82d4d0]">Isi panduan</p>
                  <span className="text-xs text-sky-100/60">Format PDF</span>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  {[
                    ["01", "Mengenal SIGAB", "Memahami tujuan dan batasan informasi."],
                    ["02", "Menjelajah peta", "Membaca wilayah dan status risiko."],
                    ["03", "Bersiap bertindak", "Mengikuti saran mitigasi yang relevan."],
                  ].map(([number, title, text]) => (
                    <div key={number} className="border-t border-white/15 pt-4">
                      <span className="text-sm font-bold text-[#f38a50]">{number}</span>
                      <h4 className="mt-3 font-semibold">{title}</h4>
                      <p className="mt-2 text-sm leading-6 text-sky-100/65">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-10 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-sm leading-6 text-sky-100/70">
                  Simpan panduan ini agar dapat dibaca kembali kapan saja.
                </p>
                <a
                  href="/Panduan%20Pengguna%20SIGAB%20(1).pdf"
                  download="Panduan-Pengguna-SIGAB.pdf"
                  className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#f38a50] px-5 py-3 text-sm font-bold text-[#123d61] transition hover:bg-[#ff9d67]"
                >
                  Download PDF
                  <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </motion.div>

          <div className="mt-20 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#26669a]">Cara kerja</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.07em] text-[#123d61] sm:text-5xl">
              Tiga langkah menuju keputusan yang lebih siap.
            </h3>
          </div>
          <div className="mt-16 border-t border-[#26669a]/20">
            {journey.map((item, index) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, x: index % 2 ? 18 : -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="grid gap-5 border-b border-[#26669a]/20 py-8 sm:grid-cols-[120px_0.7fr_1fr] sm:items-center"
              >
                <span className="text-sm font-bold text-[#f38a50]">{item.number}</span>
                <h3 className="text-3xl font-semibold tracking-[-0.06em] text-[#123d61]">{item.title}</h3>
                <p className="max-w-md text-sm leading-7 text-slate-600">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#26669a] px-6 py-24 text-white sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex max-w-[1180px] flex-col justify-between gap-8 md:flex-row md:items-end"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#82d4d0]">Mulai dari sekarang</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.07em] sm:text-6xl">
              Kenali wilayah Anda sebelum banjir datang.
            </h2>
          </div>
          <Link href="/peta-risiko" className="inline-flex shrink-0 rounded-full bg-[#f38a50] px-6 py-3 text-sm font-bold text-[#123d61] transition hover:bg-[#ff9d67]">
            Buka Peta Risiko
          </Link>
        </motion.div>
      </section>

      <section id="faq" className="bg-[#f0e7e2] px-6 py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-32"
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f38a50]">FAQ SIGAB</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.07em] text-[#123d61] sm:text-6xl">
              Pertanyaan yang sering diajukan.
            </h2>
            <p className="mt-6 max-w-sm text-base leading-8 text-slate-600">
              Temukan jawaban singkat tentang SIGAB, cara menggunakan informasi risiko, dan langkah yang perlu diperhatikan.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-[#26669a]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#82d4d0] text-[#123d61]">?</span>
              <span>Masih bingung? Mulai dari pertanyaan pertama.</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="border-t border-[#26669a]/20"
          >
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={faq.question} className="border-b border-[#26669a]/20">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="group flex w-full items-center gap-5 py-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-sm font-bold transition-colors ${isOpen ? "text-[#f38a50]" : "text-[#26669a]/50"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`flex-1 text-lg font-semibold tracking-[-0.03em] transition-colors sm:text-xl ${isOpen ? "text-[#123d61]" : "text-slate-700 group-hover:text-[#26669a]"}`}>
                      {faq.question}
                    </span>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xl font-light transition-all ${isOpen ? "rotate-45 border-[#f38a50] bg-[#f38a50] text-[#123d61]" : "border-[#26669a]/20 text-[#26669a]"}`}>
                      +
                    </span>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-7 pl-12 text-sm leading-7 text-slate-600 sm:pl-[4.25rem]">
                      {faq.answer}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

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
    </main>
  );
}
