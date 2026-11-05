import { Suspense } from "react";
import { ListingDetail } from "@/components/views/ListingDetail";

export default function Page({ params }: PageProps<"/elan/[id]">) {
  return (
    <Suspense fallback={<div className="aspect-[4/3] animate-pulse bg-surface" />}>
      {params.then(({ id }) => (
        <ListingDetail id={id} />
      ))}
    </Suspense>
  );
}
