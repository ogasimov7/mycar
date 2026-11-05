import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar, TopBarShell } from "@/components/TopBar";
import { CompareBar } from "@/components/market/CompareBar";
import { ReminderNotifier } from "@/components/ReminderNotifier";
import { Toaster } from "@/components/Toast";
import "./globals.css";

const inter = Manrope({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const display = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MyCar — al, sür, qarajında izlə",
  description: "Maşın al-sat elanları və virtual qaraj: baxış cədvəli, təmir tarixçəsi, 3D qaraj və satış qiyməti məsləhəti.",
  applicationName: "MyCar",
  appleWebApp: { capable: true, title: "MyCar", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#efebe4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="az" className={`${inter.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Suspense fallback={<TopBarShell />}>
          <TopBar />
        </Suspense>
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
        <main className="app-main mx-auto w-full max-w-7xl pb-nav lg:pb-12 lg:pl-24 lg:pr-6">{children}</main>
        <Suspense fallback={null}>
          <CompareBar />
        </Suspense>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
        <Toaster />
        <ReminderNotifier />
      </body>
    </html>
  );
}
