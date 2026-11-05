import type { Metadata } from "next";
import { NotificationsView } from "@/components/views/NotificationsView";

export const metadata: Metadata = { title: "Bildirişlər — MyCar" };

export default function Page() {
  return <NotificationsView />;
}
