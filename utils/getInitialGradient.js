// Clear-sky gradients keyed by approximate time period (no sunrise/sunset needed)
const clearGradients = {
  night:  { gradient: "linear-gradient(to bottom, #0a0a1a, #0d1b4b, #1a237e)", topColor: "#0a0a1a" },
  dawn:   { gradient: "linear-gradient(to bottom, #1a1a2e, #a0704a, #b88a5a)", topColor: "#1a1a2e" },
  day:    { gradient: "linear-gradient(to bottom, #0f3a6b, #2a5a8b, #4a7aab)", topColor: "#0f3a6b" },
  golden: { gradient: "linear-gradient(to bottom, #1a1040, #52203a, #7a3a20)", topColor: "#1a1040" },
  dusk:   { gradient: "linear-gradient(to bottom, #0f0c29, #302b63, #6b3fa0)", topColor: "#0f0c29" },
};

export function getTimePeriodFromHour(hour) {
  if (hour < 5 || hour >= 21) return "night";
  if (hour < 7)  return "dawn";
  if (hour < 18) return "day";
  if (hour < 20) return "golden";
  return "dusk";
}

export function getInitialGradient(hour) {
  return clearGradients[getTimePeriodFromHour(hour)];
}

// Self-contained inline script for <head> — runs before React, before CSS, before anything.
// Sets html element background so the very first pixel the user sees is the correct gradient.
export const initialGradientScript = `(function(){
  var h=new Date().getHours();
  var p=h<5||h>=21?'night':h<7?'dawn':h<18?'day':h<20?'golden':'dusk';
  var g={
    night:'linear-gradient(to bottom,#0a0a1a,#0d1b4b,#1a237e)',
    dawn: 'linear-gradient(to bottom,#1a1a2e,#a0704a,#b88a5a)',
    day:  'linear-gradient(to bottom,#0f3a6b,#2a5a8b,#4a7aab)',
    golden:'linear-gradient(to bottom,#1a1040,#52203a,#7a3a20)',
    dusk: 'linear-gradient(to bottom,#0f0c29,#302b63,#6b3fa0)'
  };
  document.documentElement.style.background=g[p];
})();`;
