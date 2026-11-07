"use client";

import { use } from "react";
import WilayahView from "./WilayahView";

export default function WilayahRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <WilayahView wilayah={slug} />;
}
