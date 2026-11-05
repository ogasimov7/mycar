import type { Metadata } from "next";
import { CompareView } from "@/components/views/CompareView";

export const metadata: Metadata = { title: "Müqayisə — MyCar" };

export default function Page() {
  return <CompareView />;
}
