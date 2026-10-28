"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import SiteNav from "./components/SiteNav";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

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

  return (
    <main className="min-h-screen bg-[#dfeaf0] text-slate-800">
      <SiteNav />

      <section id="home" className="relative overflow-hidden bg-[#dfeaf0]">
        <div className="absolute inset-x-0 top-0 z-0 h-[760px] bg-[#dfeaf0]" />

        <div className="absolute inset-x-0 top-0 z-0 overflow-hidden">
          <div
            className="absolute left-[-40px] top-[-60px] text-[420px] font-black text-slate-50/80 tracking-[-0.12em]"
            style={{ letterSpacing: "-0.12em" }}
          >
            FLOOD
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[1280px] px-6 pb-10 pt-8">
          <div className="grid min-h-[760px] grid-cols-[0.9fr_1.5fr] items-center gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative z-10 pt-10"
            >
              <h1 className="text-[62px] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-800">
                SIGAB
              </h1>
              <p className="mt-5 max-w-[420px] text-[16px] leading-8 text-slate-600">
                Sistem Informasi Geografis Antisipasi Banjir membantu masyarakat memahami kondisi wilayah rawan, memantau potensi bahaya, dan mempersiapkan tindakan cepat sebelum situasi memburuk.
              </p>

              <div className="mt-8 flex gap-4">
                <Link href="/peta-risiko" className="rounded-full bg-[#0d3b54] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(13,59,84,0.18)] transition hover:bg-[#123d61]">
                  Lihat data banjir
                </Link>
                <Link href="/mitigasi" className="rounded-full border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white">
                  Pelajari lebih lanjut
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative z-10 flex justify-center"
            >
              <div className="relative w-full max-w-[770px]">
                <div className="absolute inset-x-12 top-8 h-[84%] rounded-[30px] bg-white/15 blur-3xl" />

                <div className="relative h-[590px] overflow-hidden rounded-[28px] border border-white/10 shadow-[0_35px_80px_rgba(9,35,52,0.2)]">
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
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(29,74,92,0.12),rgba(14,34,52,0.62))]" />

                  <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-4">
                    <div className="max-w-xs rounded-2xl border border-white/20 bg-slate-950/45 px-4 py-3 text-white backdrop-blur-md">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#82d4d0]">
                        Video kondisi banjir
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSound}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f38a50] text-slate-900 shadow-lg transition hover:bg-[#ff9d67]"
                      aria-label={soundEnabled ? "Matikan suara video" : "Nyalakan suara video"}
                      title={soundEnabled ? "Matikan suara" : "Nyalakan suara"}
                    >
                      {soundEnabled ? (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 overflow-visible" aria-hidden="true">
                          <path
                            d="M4 10v4h3l5 4V6l-5 4H4Z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth="1.8"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 overflow-visible" aria-hidden="true">
                          <path
                            d="M4 10v4h3l5 4V6l-5 4H4Z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeLinejoin="round"
                          />
                          <path
                            d="m16 9 5 6m0-6-5 6"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth="2"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
