import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGAB | Sistem Informasi Geografis Antisipasi Peluapan",
  description: "Dashboard risiko banjir yang membantu masyarakat memantau dan menyiapkan diri terhadap ancaman banjir.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-900 text-slate-900">{children}</body>
    </html>
  );
}
