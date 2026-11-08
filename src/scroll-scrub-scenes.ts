import type { ScrollScrubScene, ScrollScrubTheme } from "@/components/scroll-scrub/scroll-scrub";

export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#ee4d2d",
  background: "#fffaf4",
  ink: "#2b211c",
  muted: "#74665d",
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    id: "descubra",
    label: "Descubra",
    poster: "/assets/world/scene-01-poster.jpg",
    clip: "/assets/world/scene-01.mp4",
    title: "Achados que fazem sentido.",
    body: "Uma vitrine simples para encontrar bons produtos, comparar com calma e comprar direto na Shopee.",
    kicker: "Seu próximo achadinho começa aqui",
    tags: ["Ofertas selecionadas", "Compra segura na Shopee"],
    scroll: 1.2,
    linger: 0.08,
  },
];
