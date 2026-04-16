"use client";

import { useState, useCallback } from "react";
import WeatherSearch from "@/components/WeatherSearch";

export default function Home() {
  const [bgStyle, setBgStyle] = useState({ backgroundColor: "#0a0a1a", backgroundImage: "linear-gradient(to bottom, #0a0a1a, #0d1b4b, #1a237e)" });

  const handleGradientChange = useCallback((gradientData) => {
    setBgStyle({ backgroundColor: "#0a0a1a", backgroundImage: gradientData.backgroundImage });
  }, []);

  return (
    <div
      className="relative min-h-dvh overflow-x-hidden"
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