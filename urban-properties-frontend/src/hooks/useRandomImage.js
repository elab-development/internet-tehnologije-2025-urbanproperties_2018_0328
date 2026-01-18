// src/hooks/useRandomImage.js
import { useCallback, useEffect, useMemo, useState } from "react";

/*
  Custom hook koji vraća jednu nasumičnu sliku sa Pexels-a.
  - Query se gradi kao: "<type> modern".
  - API ključ: REACT_APP_PEXELS_API_KEY (CRA).
  - Global cache sprečava spamovanje API-ja po tipu.
*/

const globalCache = new Map();

export default function useRandomImage(type, options = {}) {
  const {
    enabled = true,
    perPage = 24,
    size = "large",
    fallbackUrl = "",
  } = options;

  const API_KEY = process.env.REACT_APP_PEXELS_API_KEY;

  const [imageUrl, setImageUrl] = useState(fallbackUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const safeType = (type || "").toString().trim();
    return safeType ? `${safeType} modern` : "";
  }, [type]);

  const pickRandom = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx] || null;
  };

  const extractUrl = (photo) => {
    if (!photo?.src) return "";
    return photo.src[size] || photo.src.large || "";
  };

  const fetchImage = useCallback(
    async (signal) => {
      if (!enabled) return;

      if (!query) {
        setImageUrl(fallbackUrl);
        setError("");
        return;
      }

      if (!API_KEY) {
        setImageUrl(fallbackUrl);
        setError("Missing Pexels API key (REACT_APP_PEXELS_API_KEY).");
        return;
      }

      // Global cache hit.
      if (globalCache.has(query)) {
        setImageUrl(globalCache.get(query));
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query
        )}&per_page=${Math.min(Math.max(perPage, 1), 80)}`;

        const res = await fetch(url, {
          method: "GET",
          headers: { Authorization: API_KEY, Accept: "application/json" },
          signal,
        });

        if (!res.ok) throw new Error(`Pexels request failed (${res.status}).`);

        const data = await res.json();
        const photo = pickRandom(data?.photos || []);
        const urlPicked = extractUrl(photo);

        if (!urlPicked) {
          setImageUrl(fallbackUrl);
          setError("No images found for this query.");
          return;
        }

        globalCache.set(query, urlPicked);

        setImageUrl(urlPicked);
        setError("");
      } catch (e) {
        if (e?.name === "AbortError") return;
        setImageUrl(fallbackUrl);
        setError(e?.message || "Failed to load image.");
      } finally {
        setLoading(false);
      }
    },
    [API_KEY, enabled, fallbackUrl, perPage, query, size]
  );

  const refresh = useCallback(() => {
    if (query) globalCache.delete(query);

    const controller = new AbortController();
    fetchImage(controller.signal);
    return () => controller.abort();
  }, [fetchImage, query]);

  useEffect(() => {
    const controller = new AbortController();
    fetchImage(controller.signal);
    return () => controller.abort();
  }, [fetchImage]);

  return { imageUrl, loading, error, refresh };
}
