import { useMemo } from "react";

/*
  Custom hook koji vraća "random" 3D embed model (Sketchfab).
  - Komentari su na srpskom.
  - Kod je na engleskom.
  - Ako proslediš seed (npr. property.id), izbor će biti stabilan po nekretnini.
*/

const MODELS = [
  {
    title: "Autumn House",
    src: "https://sketchfab.com/models/52772448c62348e0a4951b51758d5587/embed",
  },
  {
    title: "Lisboa House",
    src: "https://sketchfab.com/models/66774893d4da4055abb72d2b93c22cab/embed",
  },
  {
    title: "American House",
    src: "https://sketchfab.com/models/87b24124ea0a4d8aa2af285efc9fcafa/embed",
  },
  {
    title: "American vintage house (with interior)",
    src: "https://sketchfab.com/models/5a9e087fbd3a4ae79b4c51d6279f0466/embed",
  },
  {
    title: "City at night",
    src: "https://sketchfab.com/models/45b227092fbe42edad4162d5eff5dc65/embed",
  },
];

function hashSeed(seed) {
  const s = String(seed ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function useRandom3DImage(seed) {
  const model = useMemo(() => {
    if (!MODELS.length) return { title: "3D Model", src: "" };
    const idx = hashSeed(seed) % MODELS.length;
    return MODELS[idx];
  }, [seed]);

  return {
    title: model.title,
    embedUrl: model.src,
  };
}
