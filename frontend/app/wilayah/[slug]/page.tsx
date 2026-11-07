import { Suspense } from "react";
import SiteFooter from "../../components/SiteFooter";
import WilayahRoute from "./WilayahRoute";

export function generateStaticParams() {
  return [{ slug: "surabaya" }];
}

export default function WilayahPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#dfeaf0]" />}>
      <WilayahRoute params={params} />
      <SiteFooter />
    </Suspense>
  );
}
