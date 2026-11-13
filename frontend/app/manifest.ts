import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIGAB - Sistem Informasi Siaga Banjir",
    short_name: "SIGAB",
    description: "Pemantauan risiko banjir dan peringatan wilayah pantauan.",
    start_url: "/daerah-anda",
    display: "standalone",
    background_color: "#dfeaf0",
    theme_color: "#123d61",
    lang: "id",
    icons: [
      {
        src: "/banjir.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
