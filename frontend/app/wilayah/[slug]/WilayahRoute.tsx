"use client";

import { use } from "react";
import WilayahView, { type WilayahInitialData } from "./WilayahView";

type Props = {
  params: Promise<{ slug: string }>;
  initial?: WilayahInitialData | null;
};

export default function WilayahRoute({ params, initial }: Props) {
  const { slug } = use(params);
  return <WilayahView key={slug} wilayah={slug} initial={initial} />;
}
