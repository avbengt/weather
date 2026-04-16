"use client";

import { useState, useCallback, useEffect } from "react";
import WeatherSearch from "@/components/WeatherSearch";

export default function Home() {
  const [bgStyle, setBgStyle] = useState({ backgroundColor: "#0a0a1a", backgroundImage: "linear-gradient(to bottom, #0a0a1a, #0d1b4b, #1a237e)" });

  useEffect(() => {
    const probe = () => {
      const x = window.innerWidth / 2;
      const y = window.innerHeight - 1;
      const el = document.elementFromPoint(x, y);
      if (el) {
        const bg = getComputedStyle(el).backgroundColor;
        console.log("[Safari bg probe] bottommost element:", el.tagName, el.className, "| background-color:", bg);
      }
    };
    probe();
    window.addEventListener("resize", probe);
    return () => window.removeEventListener("resize", probe);
  }, []);

  const handleGradientChange = useCallback((gradientData) => {
    setBgStyle({ backgroundColor: "#0a0a1a", backgroundImage: gradientData.backgroundImage });
  }, []);

  return (
    <div
      className="relative min-h-dvh overflow-x-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="fixed inset-0 z-0 pointer-events-none will-change-transform transform-gpu transition-all duration-700"
        style={bgStyle}
      />
      <main className="relative z-10 min-h-dvh">
        <WeatherSearch onGradientChange={handleGradientChange} />
      </main>
    </div>
  );
}