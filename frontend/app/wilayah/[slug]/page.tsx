import SiteFooter from "../../components/SiteFooter";
import WilayahView from "./WilayahView";

export function generateStaticParams() {
  return [{ slug: "surabaya" }];
}

export default async function WilayahPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <WilayahView wilayah={slug} />
      <SiteFooter />
    </>
  );
}
