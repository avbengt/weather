"use client";

import { useRef, useState, useEffect } from "react";
import { getCoordinates } from "@/utils/getCoordinates";
import { getTimeOfDayGradient } from "@/utils/getTimeOfDayGradient";
import fetchWeather from "@/utils/fetchWeather";
import { iconRegistry, mapWeatherIcon } from "@/components/iconRegistry";
import HeroImage from "./HeroImage";
import WeatherIcon from "@/components/WeatherIcon";
import PlacesAutocompleteInput from "@/components/PlacesAutocompleteInput";


const stateLookup = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO",
  connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY"
};

const countryLookup = {
  IE: "Ireland", CA: "Canada", FR: "France", DE: "Germany", IN: "India", AU: "Australia",
  MX: "Mexico", BR: "Brazil", JP: "Japan", CN: "China", IT: "Italy", ES: "Spain",
  SE: "Sweden", NO: "Norway", NZ: "New Zealand"
};

function degreesToCardinal(deg) {
  if (deg === undefined || deg === null) return "";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function getMoonPhaseIcon(moonPhase) {
  if (moonPhase === 0) return "wi-moon-new";
  if (moonPhase > 0 && moonPhase < 0.25) {
    if (moonPhase < 0.04) return "wi-moon-waxing-crescent-1";
    if (moonPhase < 0.08) return "wi-moon-waxing-crescent-2";
    if (moonPhase < 0.12) return "wi-moon-waxing-crescent-3";
    if (moonPhase < 0.16) return "wi-moon-waxing-crescent-4";
    if (moonPhase < 0.2) return "wi-moon-waxing-crescent-5";
    return "wi-moon-waxing-crescent-6";
  }
  if (moonPhase === 0.25) return "wi-moon-first-quarter";
  if (moonPhase > 0.25 && moonPhase < 0.5) {
    if (moonPhase < 0.3) return "wi-moon-waxing-gibbous-1";
    if (moonPhase < 0.34) return "wi-moon-waxing-gibbous-2";
    if (moonPhase < 0.38) return "wi-moon-waxing-gibbous-3";
    if (moonPhase < 0.42) return "wi-moon-waxing-gibbous-4";
    if (moonPhase < 0.46) return "wi-moon-waxing-gibbous-5";
    return "wi-moon-waxing-gibbous-6";
  }
  if (moonPhase === 0.5) return "wi-moon-full";
  if (moonPhase > 0.5 && moonPhase < 0.75) {
    if (moonPhase < 0.54) return "wi-moon-waning-gibbous-1";
    if (moonPhase < 0.58) return "wi-moon-waning-gibbous-2";
    if (moonPhase < 0.62) return "wi-moon-waning-gibbous-3";
    if (moonPhase < 0.66) return "wi-moon-waning-gibbous-4";
    if (moonPhase < 0.7) return "wi-moon-waning-gibbous-5";
    return "wi-moon-waning-gibbous-6";
  }
  if (moonPhase === 0.75) return "wi-moon-third-quarter";
  if (moonPhase > 0.75 && moonPhase < 1) {
    if (moonPhase < 0.8) return "wi-moon-waning-crescent-1";
    if (moonPhase < 0.84) return "wi-moon-waning-crescent-2";
    if (moonPhase < 0.88) return "wi-moon-waning-crescent-3";
    if (moonPhase < 0.92) return "wi-moon-waning-crescent-4";
    if (moonPhase < 0.96) return "wi-moon-waning-crescent-5";
    return "wi-moon-waning-crescent-6";
  }
  return "wi-moon-new";
}

function getMoonPhaseLabel(moonPhase) {
  if (moonPhase === 0) return "New Moon";
  if (moonPhase > 0 && moonPhase < 0.25) return "Waxing Crescent";
  if (moonPhase === 0.25) return "First Quarter";
  if (moonPhase > 0.25 && moonPhase < 0.5) return "Waxing Gibbous";
  if (moonPhase === 0.5) return "Full Moon";
  if (moonPhase > 0.5 && moonPhase < 0.75) return "Waning Gibbous";
  if (moonPhase === 0.75) return "Last Quarter";
  if (moonPhase > 0.75 && moonPhase <= 1) return "Waning Crescent";
  return "Unknown";
}

export default function WeatherSearch({ onGradientChange }) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [locations, setLocations] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [weather, setWeather] = useState(null);
  const [description, setDescription] = useState("");
  const [units, setUnits] = useState("imperial");
  const [error, setError] = useState("");
  const [localTime, setLocalTime] = useState("");
  const [isNight, setIsNight] = useState(false);
  const [conditionId, setConditionId] = useState(null);
  const iconCode = weather?.weather?.[0]?.icon;
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [dewPoint, setDewPoint] = useState(null);
  const [uvi, setUvi] = useState(null);
  const [moonPhase, setMoonPhase] = useState(null);
  const [fiveDayForecast, setFiveDayForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [scrollThumbWidth, setScrollThumbWidth] = useState(20);
  const [scrollThumbLeft, setScrollThumbLeft] = useState(0);

  function formatHour(unix, offset) {
    const localTime = new Date(unix * 1000);
    return localTime.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  }

  function updateScrollIndicator() {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const scrollable = scrollWidth - clientWidth;
    const thumbWidthPct = Math.max(10, (clientWidth / scrollWidth) * 100);
    const thumbLeftPct = scrollable > 0 ? (scrollLeft / scrollable) * (100 - thumbWidthPct) : 0;
    setScrollThumbWidth(thumbWidthPct);
    setScrollThumbLeft(thumbLeftPct);
  }

  useEffect(() => {
    if (!weather?.current?.dt || !weather?.sunrise || !weather?.sunset) return;
    const g = getTimeOfDayGradient(weather.current.dt, weather.sunrise, weather.sunset, conditionId);
    onGradientChange?.(g);
  }, [
    onGradientChange,
    weather?.current?.dt ?? null,
    weather?.sunrise ?? null,
    weather?.sunset ?? null,
    conditionId,
  ]);

  useEffect(() => {
    if (isInitialLoad && "geolocation" in navigator) {
      console.log("Requesting geolocation...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Geolocation position received:", latitude, longitude);
          setSelectedLocation({ lat: latitude, lon: longitude });
          setIsInitialLoad(false);
        },
        (error) => {
          console.error("Error getting geolocation:");
          console.error("Code:", error?.code);
          console.error("Message:", error?.message);
          console.error("Full error object:", error);
          setError("Location access denied or unavailable. Please search manually.");
          setIsInitialLoad(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, [isInitialLoad]);

  useEffect(() => {
    if (selectedLocation && weather) {
      setInput("");
    }
  }, [selectedLocation, weather]);

  useEffect(() => {
    if (hourlyForecast.length > 0) {
      requestAnimationFrame(updateScrollIndicator);
    }
  }, [hourlyForecast]);

  useEffect(() => {
    if (selectedLocation && selectedLocation.lat && selectedLocation.lon) {
      (async () => {
        const result = await fetchWeather(selectedLocation, units);
        handleWeatherResult(result, selectedLocation);
      })();
    }
  }, [selectedLocation, units]);

  const handleWeatherResult = async (result, loc) => {
    if (!result || result.error) {
      console.error("Weather fetch failed or result is undefined:", result);
      setError(result?.error || "Failed to fetch weather data.");
      return;
    }

    const {
      current,
      dewPoint,
      uvi,
      moonPhase,
      dailyForecast,
      hourlyForecast,
      timezoneOffset,
    } = result;

    if (!current) {
      console.error("Weather data is missing or incomplete:", result);
      setError("Weather data is incomplete.");
      return;
    }

    const now = current.dt;
    const utcMs = Date.now() + (new Date().getTimezoneOffset() * 60 * 1000);
    const locationMs = utcMs + (timezoneOffset * 1000);
    const locationLocalTime = new Date(locationMs);
    const localTimeFormatted = locationLocalTime.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + " local time";
    setLocalTime(localTimeFormatted);

    const sunrise = current?.sunrise || 0;
    const sunset = current?.sunset || 0;
    const isNightTime = now < sunrise || now > sunset;

    // Start with location data passed from Google Places selection
    let cityName = loc.city || "";
    let stateName = loc.state || "";
    let countryName = loc.country || "US";
    let zip = "";

    // Only do reverse geocoding as fallback if city name is missing
    if (!cityName) {
      try {
        const googleRes = await fetch(
          `/api/reverseGeocode?lat=${loc.lat}&lon=${loc.lon}`
        );

        if (!googleRes.ok) {
          console.warn("Geocoding service unavailable, using coordinates only");
        } else {
          const googleData = await googleRes.json();

          if (googleData.results && googleData.results.length > 0) {
            const components = googleData.results[0].address_components;

            const cityComponent =
              components.find(c => c.types.includes("postal_town")) ||
              components.find(c => c.types.includes("sublocality_level_1")) ||
              components.find(c => c.types.includes("locality")) ||
              components.find(c => c.types.includes("neighborhood"));

            const stateComponent = components.find(c =>
              c.types.includes("administrative_area_level_1")
            );
            const countryComponent = components.find(c =>
              c.types.includes("country")
            );
            const zipComponent = components.find(c =>
              c.types.includes("postal_code")
            );

            cityName = cityComponent?.long_name || "";
            stateName = stateComponent?.short_name || "";
            countryName = countryComponent?.short_name || "US";
            zip = zipComponent?.long_name || "";
          }
        }
      } catch (error) {
        console.error("Google reverse geocoding failed:", error);
      }
    }

    if (!inputFocused) {
      const lookupState = stateLookup[stateName.toLowerCase()] || stateName;
      const isDuplicate = stateName && cityName.toLowerCase() === lookupState.toLowerCase();
      setInput(`${cityName}${stateName && !isDuplicate ? `, ${lookupState}` : ""}${countryName !== "US" ? `, ${countryLookup[countryName] || countryName}` : ""}`);
    }

    setWeather({
      lat: loc.lat,
      lon: loc.lon,
      city: cityName,
      state: stateName,
      country: countryName,
      zip: zip,
      current: current,
      daily: dailyForecast,
      visibility: current.visibility,
      wind: current.wind_speed,
      windDeg: current.wind_deg,
      conditionId: current.weather[0].id,
      description: current.weather[0].description,
      sunrise: current.sunrise,
      sunset: current.sunset,
      temp: current.temp,
      feels_like: current.feels_like,
      pressure: current.pressure,
      humidity: current.humidity,
      moon_phase: moonPhase,
    });

    setIsNight(isNightTime);
    setConditionId(current.weather[0].id);
    setDescription(current.weather[0].description);
    setDewPoint(dewPoint);
    setUvi(uvi);
    setMoonPhase(moonPhase);
    setFiveDayForecast(dailyForecast);
    setHourlyForecast(hourlyForecast);
  };

  const toggleUnits = () => {
    setUnits((prev) => (prev === "imperial" ? "metric" : "imperial"));
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && input.trim().length > 0) {
      e.preventDefault();
      try {
        const result = await getCoordinates(input, units);
        if (Array.isArray(result) && result.length > 0) {
          const loc = result[0];
          setSelectedLocation({
            city: loc.name,
            state: loc.state,
            country: loc.country,
            lat: loc.lat,
            lon: loc.lon
          });
          setInput("");

          const weatherResult = await fetchWeather(loc, units);
          handleWeatherResult(weatherResult, loc);
        } else if (result) {
          setSelectedLocation({
            city: result.name,
            state: result.state,
            country: result.country,
            lat: result.lat,
            lon: result.lon
          });
          setInput("");
          const weatherResult = await fetchWeather(result, units);
          handleWeatherResult(weatherResult, result);
        } else {
          setError("Location not found.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch location.");
      }
    }
  };

  const hasWeatherData = weather?.temp !== undefined;

  // Icon references
  const SunriseIcon = iconRegistry["wi-sunrise"];
  const SunsetIcon = iconRegistry["wi-sunset"];
  const WindIcon = iconRegistry["wi-wind"];
  const PressureIcon = iconRegistry["wi-barometer"];
  const VisibilityIcon = iconRegistry["wi-visibility"];
  const UVIcon = iconRegistry["wi-uvi"];

  // Moon phase derived values
  const moonPhaseFloat = parseFloat(weather?.moon_phase);
  const moonIconKey = !isNaN(moonPhaseFloat) ? getMoonPhaseIcon(moonPhaseFloat) : null;
  const moonLabel = !isNaN(moonPhaseFloat) ? getMoonPhaseLabel(moonPhaseFloat) : "N/A";
  const MoonIcon = moonIconKey ? iconRegistry[moonIconKey] : null;

  // Temperature range across the week (for daily forecast bar)
  const weekMin = fiveDayForecast.length > 0 ? Math.min(...fiveDayForecast.map(d => d.temp.min)) : 0;
  const weekMax = fiveDayForecast.length > 0 ? Math.max(...fiveDayForecast.map(d => d.temp.max)) : 1;

  // Derived location display name (persists from weather state, not cleared with input)
  const locationDisplay = (() => {
    if (!weather?.city) {
      if (weather?.country === "US" && weather?.zip) {
        return `ZIP ${weather.zip}`;
      }
      if (weather?.country && weather.country !== "US") {
        return countryLookup[weather.country] || weather.country;
      }
      return null;
    }

    const city = weather.city;
    const stateName = weather.state ? (stateLookup[weather.state.toLowerCase()] || weather.state) : "";
    const countryName = weather.country && weather.country !== "US" ? (countryLookup[weather.country] || weather.country) : "";

    // Deduplicate: don't show state if it matches city name
    const isDuplicate = stateName && city.toLowerCase() === stateName.toLowerCase();

    let display = city;
    if (stateName && !isDuplicate) {
      display += `, ${stateName}`;
    }
    if (countryName) {
      display += `, ${countryName}`;
    }
    return display;
  })();

  return (
    <div className="min-h-dvh w-full">
      <div className="max-w-[560px] mx-auto w-full px-5">

        {/* Top bar */}
        <header className="pt-4 pb-8">
          <div className="flex items-center gap-3">

            {/* Search pill */}
            <div className="flex-1 min-w-0">
              <PlacesAutocompleteInput
                value={input}
                onChange={(val) => setInput(val)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onPlaceSelected={async (place) => {
                  const newLocation = {
                    city: place.name,
                    state: place.state,
                    country: place.country,
                    lat: place.lat,
                    lon: place.lon
                  };
                  setSelectedLocation(newLocation);
                  const result = await fetchWeather(newLocation, units);
                  handleWeatherResult(result, newLocation);
                  setInput("");
                }}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* °F / °C toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-xs font-medium ${units === "imperial" ? "text-white" : "text-white/40"}`}>°F</span>
              <button
                onClick={toggleUnits}
                className="relative inline-flex h-5 w-8 items-center rounded-full transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                aria-label="Toggle temperature units"
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{ transform: units === "imperial" ? "translateX(2px)" : "translateX(14px)" }}
                />
              </button>
              <span className={`text-xs font-medium ${units === "metric" ? "text-white" : "text-white/40"}`}>°C</span>
            </div>

          </div>
        </header>

        {hasWeatherData && (
          <div className="flex flex-col text-sm md:text-base">

            {/* Location name */}
            {locationDisplay && (
              <h2 className="text-white text-2xl md:text-3xl font-light tracking-tight text-center mb-1">
                {locationDisplay}
              </h2>
            )}

            {/* Timestamp */}
            {localTime && (
              <p className="text-white/40 text-xs text-center mb-3">as of {localTime}</p>
            )}

            {/* Hero section */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 min-h-[150px] my-2">
              <div className="flex-shrink-0">
                <HeroImage
                  conditionId={conditionId}
                  iconCode={weather?.current?.weather?.[0]?.icon}
                  description={weather?.description}
                />
              </div>
              <div className="text-left">
                <p className="text-white text-8xl md:text-9xl font-thin tracking-tighter leading-none">
                  {Math.round(weather.temp)}°
                </p>
                <p className="text-white/70 text-base mt-1">
                  Feels like {Math.round(weather.feels_like)}°
                </p>
                <p className="text-white/50 text-sm mt-0.5 capitalize">
                  {description.charAt(0).toUpperCase() + description.slice(1)}
                </p>
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="grid grid-cols-4 gap-2 mt-5">
              {[
                { label: "High", value: `${Math.round(fiveDayForecast[0]?.temp?.max)}°` },
                { label: "Low", value: `${Math.round(fiveDayForecast[0]?.temp?.min)}°` },
                { label: "Humidity", value: `${weather.humidity}%` },
                { label: "Dew point", value: dewPoint !== null ? `${Math.round(dewPoint)}°` : "N/A" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center bg-white/10 rounded-full py-2.5 px-1">
                  <span className="text-white/50 text-[10px] leading-tight">{label}</span>
                  <span className="text-white font-medium text-sm leading-tight">{value}</span>
                </div>
              ))}
            </div>

            {/* Hourly forecast */}
            <div className="mt-7">
              <h3 className="text-white/50 text-xs uppercase tracking-widest mb-3">Hourly</h3>
              <div
                ref={scrollRef}
                className="flex overflow-x-auto hide-scrollbar gap-2 cursor-grab active:cursor-grabbing select-none"
                style={{
                  maskImage: "linear-gradient(to right, black 85%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, black 85%, transparent 100%)",
                }}
                onScroll={updateScrollIndicator}
                onMouseDown={(e) => {
                  setIsDragging(true);
                  setStartX(e.pageX - scrollRef.current.offsetLeft);
                  setScrollLeft(scrollRef.current.scrollLeft);
                }}
                onMouseLeave={() => setIsDragging(false)}
                onMouseUp={() => {
                  setIsDragging(false);
                  updateScrollIndicator();
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  e.preventDefault();
                  const x = e.pageX - scrollRef.current.offsetLeft;
                  const walk = (x - startX) * 1.5;
                  scrollRef.current.scrollLeft = scrollLeft - walk;
                }}
              >
                {hourlyForecast.map((hour, index) => {
                  const displayHour = index === 0 ? "Now" : formatHour(hour.dt);
                  const IconComponent = mapWeatherIcon(hour.weather[0].icon);
                  return (
                    <div
                      key={index}
                      className={`flex flex-col items-center justify-between w-16 p-2.5 gap-1.5 rounded-xl text-white text-center flex-shrink-0 ${index === 0
                        ? "bg-white/25 border border-white/20"
                        : "bg-white/10"
                        }`}
                    >
                      <p className={`text-xs ${index === 0 ? "text-white font-medium" : "text-white/60"}`}>
                        {displayHour}
                      </p>
                      {IconComponent && <IconComponent className="h-5 text-white" />}
                      <p className="font-semibold text-sm">{Math.round(hour.temp)}°</p>
                    </div>
                  );
                })}
              </div>
              {/* Scroll indicator */}
              <div
                className="mt-2 h-[3px] w-full rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <div
                  className="h-full rounded-full transition-[margin,width] duration-100 ease-out"
                  style={{
                    width: `${scrollThumbWidth}%`,
                    marginLeft: `${scrollThumbLeft}%`,
                    backgroundColor: "rgba(255,255,255,0.45)",
                  }}
                />
              </div>
            </div>

            {/* Daily forecast */}
            <div className="mt-7">
              <h3 className="text-white/50 text-xs uppercase tracking-widest mb-1">Daily</h3>
              {fiveDayForecast.length > 0 && (
                <div className="flex flex-col">
                  {fiveDayForecast.map((day, i) => {
                    const span = weekMax - weekMin || 1;
                    const leftPct = ((day.temp.min - weekMin) / span) * 100;
                    const widthPct = ((day.temp.max - day.temp.min) / span) * 100;
                    return (
                      <div
                        key={day.dt}
                        className={`flex items-center gap-3 py-3 ${i < fiveDayForecast.length - 1 ? "border-b border-white/10" : ""
                          }`}
                      >
                        <span className="w-9 shrink-0 text-white/60 text-sm">
                          {new Date(day.dt * 1000).toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                        <WeatherIcon
                          conditionId={day.weather[0].id}
                          isNight={false}
                          className="h-5 w-5 text-white shrink-0"
                        />
                        <span className="flex-1 text-white/60 text-xs truncate capitalize min-w-0">
                          {day.weather[0].description}
                        </span>
                        <div className="relative w-16 h-[3px] bg-white/20 rounded-full overflow-hidden shrink-0">
                          <div
                            className="absolute top-0 h-full bg-white/70 rounded-full"
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="text-white text-sm text-right shrink-0 w-14">
                          {Math.round(day.temp.max)}°
                          <span className="text-white/50">/{Math.round(day.temp.min)}°</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom cards: Air & Wind + Sun & Moon */}
            <div className="grid grid-cols-2 gap-3 mt-7">

              {/* Air & Wind */}
              <div className="bg-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-white/50 text-[10px] uppercase tracking-widest">Air & Wind</h3>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs flex items-center gap-1.5">
                    {WindIcon && <WindIcon className="w-4 h-4 fill-white/60 shrink-0" />}
                    Wind
                  </span>
                  <span className="text-white text-xs text-right">
                    {weather.wind?.toFixed(1)}{" "}
                    {units === "imperial" ? "mph" : "m/s"}{" "}
                    {degreesToCardinal(weather.windDeg)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs flex items-center gap-1.5">
                    {PressureIcon && <PressureIcon className="w-4 h-4 fill-white/60 shrink-0" />}
                    Pressure
                  </span>
                  <span className="text-white text-xs">{weather.pressure} hPa</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs flex items-center gap-1.5">
                    {VisibilityIcon && <VisibilityIcon className="w-4 h-4 fill-white/60 shrink-0" />}
                    Visibility
                  </span>
                  <span className="text-white text-xs">
                    {units === "imperial"
                      ? `${(weather.visibility * 0.000621371).toFixed(1)} mi`
                      : `${(weather.visibility / 1000).toFixed(1)} km`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs flex items-center gap-1.5">
                    {UVIcon && <UVIcon className="w-4 h-4 fill-white/60 shrink-0" />}
                    UV Index
                  </span>
                  <span className="text-white text-xs">{uvi !== null ? uvi : "N/A"}</span>
                </div>
              </div>

              {/* Sun & Moon */}
              <div className="bg-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <h3 className="text-white/50 text-[10px] uppercase tracking-widest">Sun & Moon</h3>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs flex items-center gap-1.5">
                    {SunriseIcon && <SunriseIcon className="w-4 h-4 fill-white/60 shrink-0" />}
                    Sunrise
                  </span>
                  <span className="text-white text-xs">
                    {new Date(weather.sunrise * 1000).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs flex items-center gap-1.5">
                    {SunsetIcon && <SunsetIcon className="w-4 h-4 fill-white/60 shrink-0" />}
                    Sunset
                  </span>
                  <span className="text-white text-xs">
                    {new Date(weather.sunset * 1000).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                {/* Moon phase — emphasized row */}
                <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-auto">
                  <span className="text-white/60 text-xs flex items-center gap-1.5">
                    {MoonIcon && <MoonIcon className="w-4 h-4 fill-white/80 shrink-0" />}
                    Moon
                  </span>
                  <span className="text-white text-[13px] font-medium whitespace-nowrap">{moonLabel}</span>
                </div>
              </div>

            </div>

            <footer className="p-4 mt-8 mb-4 flex flex-col items-center gap-2">
              <p className="text-white/40 text-xs text-center">
                Built by{" "}
                <a href="https://alissa.dev/" target="_blank" className="decoration-none hover:underline hover:decoration-solid">
                  Alissa Bengtson
                </a>
                {" "}·{" "}
                Weather condition icons by <a
                  href="https://www.freepik.com/author/macrovector" target="_blank"
                  className="decoration-none hover:underline hover:decoration-solid"
                >
                  macrovector
                </a>
              </p>
            </footer>

          </div>
        )}

      </div>
    </div>
  );
}
