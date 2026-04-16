"use client";

import { useState, useCallback, useEffect, useLayoutEffect } from "react";
import WeatherSearch from "@/components/WeatherSearch";
import { getInitialGradient } from "@/utils/getInitialGradient";

export default function Home() {
  const [bgStyle, setBgStyle] = useState({ backgroundColor: "transparent", backgroundImage: "none" });

  useLayoutEffect(() => {
    const { gradient, topColor } = getInitialGradient(new Date().getHours());
    setBgStyle({ backgroundColor: topColor, backgroundImage: gradient });
  }, []);

  useEffect(() => {
    window.addEventListener('load', () => {
      const elements = document.querySelectorAll('*');
      let bottommost = null;
      let maxBottom = 0;
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        if (rect.bottom > maxBottom && bg !== 'rgba(0, 0, 0, 0)' &&
            bg !== 'transparent') {
          maxBottom = rect.bottom;
          bottommost = { el: el.tagName + ' ' + el.className, bg };
        }
      });
      console.log('Bottommost solid element:', bottommost);
    });
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