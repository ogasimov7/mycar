import { Suspense } from "react";
import { GarageView } from "@/components/garage/GarageView";

export default function Page({ params }: PageProps<"/qaraj/[id]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#eef0f2]" />}>
      {params.then(({ id }) => (
        <GarageView id={id} />
      ))}
    </Suspense>
  );
}
