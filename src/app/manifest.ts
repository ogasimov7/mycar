import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyCar — al, sür, qarajında izlə",
    short_name: "MyCar",
    description: "Maşın elanları və virtual qaraj: baxış cədvəli, sənədlər, xərclər və xatırlatmalar.",
    lang: "az",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eeeae5",
    theme_color: "#eeeae5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
