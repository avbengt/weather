"use client";

import { useRef, useState, useEffect } from "react";
import { getCoordinates } from "@/utils/getCoordinates";
import { getTimeOfDayGradient } from "@/utils/getTimeOfDayGradient";
import fetchWeather from "@/utils/fetchWeather";
import { iconRegistry } from "@/components/iconRegistry";
import { mapWeatherIcon } from "@/components/iconRegistry";
import HeroImage from "./HeroImage";
import WeatherIcon from "@/components/WeatherIcon";
import MoonPhase from "@/components/MoonPhase";
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

  function formatHour(unix, offset) {
    const localTime = new Date(unix * 1000);
    return localTime.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  }

  useEffect(() => {
    if (!weather?.current?.dt || !weather?.sunrise || !weather?.sunset) return;
    const g = getTimeOfDayGradient(weather.current.dt, weather.sunrise, weather.sunset);
    onGradientChange?.(g);
  }, [
    onGradientChange,
    weather?.current?.dt ?? null,
    weather?.sunrise ?? null,
    weather?.sunset ?? null,
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
    } = result;

    if (!current) {
      console.error("Weather data is missing or incomplete:", result);
      setError("Weather data is incomplete.");
      return;
    }

    const now = current.dt;
    const localTimeFormatted = new Date(now * 1000).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    setLocalTime(localTimeFormatted);

    const sunrise = current?.sunrise || 0;
    const sunset = current?.sunset || 0;
    const isNightTime = now < sunrise || now > sunset;

    let cityName = "";
    let stateName = "";
    let countryName = "US";
    let zip = "";

    try {
      const googleRes = await fetch(
        `/api/reverseGeocode?lat=${loc.lat}&lon=${loc.lon}`
      );

      if (!googleRes.ok) {
        console.warn("Geocoding service unavailable, using coordinates only");
        // Keep cityName, stateName, etc. as empty strings - will fall back to coordinates
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
      // Keep cityName, stateName, etc. as empty strings - will fall back to coordinates
    }

    if (!inputFocused) {
      setInput(`${cityName}${stateName ? `, ${stateLookup[stateName.toLowerCase()] || stateName}` : ""}${countryName !== "US" ? `, ${countryLookup[countryName] || countryName}` : ""}`);
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
  const HumidityIcon = iconRegistry["wi-humidity"];
  const PressureIcon = iconRegistry["wi-barometer"];
  const VisibilityIcon = iconRegistry["wi-visibility"];
  const WindIcon = iconRegistry["wi-wind"];
  const DewPointIcon = iconRegistry["wi-dewpoint"];
  const UVIcon = iconRegistry["wi-uvi"];
  const SunriseIcon = iconRegistry["wi-sunrise"];
  const SunsetIcon = iconRegistry["wi-sunset"];
  const HighLowIcon = iconRegistry["wi-thermometer"];

  return (
    <div className="min-h-dvh w-full">
      <header className="max-w-[48rem] mx-auto h-[50px] md:h-[76px] py-2 md:py-4 z-1">
        <div className="flex items-center justify-between h-full relative mx-auto px-4 md:px-0">

          <div className="relative">
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

          {/* <div className="flex items-center">
            <span className="ml-2 [font-family:var(--font-fjord-one)] text-white text-base md:text-2xl"><a href="https://www.alissa.dev">alissa.dev</a><span className="text-[#5ce1e6] [font-family:var(--font-dancing-script)] text-xl md:text-3xl font-bold border-l border-l-white/35 ps-2 ms-2">weather</span></span>
          </div> */}

          <div className="flex items-center gap-2 md:px-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${units === "imperial" ? "text-white font-bold" : "text-white/60"}`}>°F</span>
              <button
                onClick={toggleUnits}
                className="relative inline-flex h-5 w-8 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.4)"
                }}
                aria-label="Toggle temperature units"
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{
                    transform: units === "imperial" ? "translateX(2px)" : "translateX(14px)"
                  }}
                />
              </button>
              <span className={`text-sm ${units === "metric" ? "text-white font-bold" : "text-white/60"}`}>°C</span>
            </div>
          </div>
        </div>
      </header>

      {hasWeatherData && (
        <div className="container w-full flex flex-col mx-auto">
          <div className="w-full text-center">
            <h2 className="text-white text-2xl md:text-3xl tracking-tight font-light mb-3">
              {weather.city ? (
                <>
                  {weather.city}
                  {weather.state ? `, ${stateLookup[weather.state.toLowerCase()] || weather.state}` : ""}
                  {weather.country && weather.country !== "US"
                    ? `, ${countryLookup[weather.country] || weather.country}`
                    : ""}
                </>
              ) : weather.zip ? (
                `ZIP ${weather.zip}`
              ) : (
                `${weather.lat?.toFixed(4)}, ${weather.lon?.toFixed(4)}`
              )}
              {localTime && (
                <span className="text-white/60 font-normal text-base block">
                  as of {localTime}
                </span>
              )}
            </h2>
          </div>
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 min-h-[150px] my-3">

            <div className="items-center justify-center">
              <HeroImage
                conditionId={conditionId}
                iconCode={weather?.current?.weather?.[0]?.icon}
                description={weather?.description}
              />
            </div>
            <div className="">
              <p className="text-white text-8xl md:text-9xl font-thin tracking-tighter">
                {Math.round(weather.temp)}°
              </p>
              <p className="text-white text-base md:text-lg">Feels like: {Math.round(weather.feels_like)}°</p>
              <p className="text-white/60 text-sm md:text-base text-center">
                {description.charAt(0).toUpperCase() + description.slice(1)}
              </p>
            </div>
          </div>



          <ul className="mt-4 grid grid-cols-2 gap-x-8 text-white text-sm leading-6 md:text-base">
            <li className="datapoint flex items-center justify-between">
              <div className="flex items-center gap-3">
                {HighLowIcon && <HighLowIcon className="w-6 h-6 fill-white block shrink-0" />}
                <span>High/Low:</span>
              </div>
              <span>
                {Math.round(fiveDayForecast[0]?.temp?.max)}°/{Math.round(fiveDayForecast[0]?.temp?.min)}°
              </span>
            </li>

            <li className="datapoint flex items-center justify-between">
              <div className="flex items-center gap-3">
                {DewPointIcon && <DewPointIcon className="w-6 h-6 fill-white" />}
                <span>Dew Point:</span>
              </div>
              <span>
                {dewPoint !== null ? `${Math.round(dewPoint)}°` : "N/A"}
              </span>
            </li>

            <li className="datapoint border-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                {HumidityIcon && <HumidityIcon className="w-6 h-6 fill-white" />}
                <span>Humidity:</span>
              </div>
              <span>{weather.humidity}%</span>
            </li>

            <li className="datapoint border-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                {UVIcon && <UVIcon className="w-6 h-6 fill-white" />}
                <span>UV Index:</span>
              </div>
              <span>{uvi !== null ? uvi : "N/A"}</span>
            </li>
          </ul>

          <h3 className="mt-8 font-bold text-white text-sm text-left uppercase">Hourly</h3>
          <div className="relative w-full mt-3">

            <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-10 rounded-l" />
            <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white/10 to-transparent pointer-events-none z-10 rounded-r" />

            {/* Scrollable Row with Drag Support */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto hide-scrollbar gap-2 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={(e) => {
                setIsDragging(true);
                setStartX(e.pageX - scrollRef.current.offsetLeft);
                setScrollLeft(scrollRef.current.scrollLeft);
              }}
              onMouseLeave={() => setIsDragging(false)}
              onMouseUp={() => setIsDragging(false)}
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
                    className="flex flex-col items-center justify-between bg-white/15 w-18 p-2 gap-2 rounded text-white text-center text-sm flex-shrink-0"
                  >
                    <p>{displayHour}</p>
                    {IconComponent && <IconComponent className="h-5 text-white" />}
                    <p className="font-bold text-base">{Math.round(hour.temp)}°</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            {fiveDayForecast.length > 0 && (
              <div className="w-full text-white">
                <h3 className="mt-8 font-bold text-white text-sm text-left uppercase">
                  5-Day Forecast
                </h3>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-4">
                  {fiveDayForecast.map((day) => (
                    <div
                      key={day.dt}
                      className="flex sm:flex-col items-center sm:items-center text-left sm:text-center w-full sm:w-1/5 bg-white/10 p-4 rounded gap-3"
                    >
                      {/* Date */}
                      <div className="font-semibold min-w-[70px]">
                        {new Date(day.dt * 1000).toLocaleDateString(undefined, {
                          weekday: "short",
                        })}
                      </div>

                      {/* Icon + Description */}
                      <div className="flex items-center gap-4 sm:gap-2 sm:flex-col sm:items-center">
                        <WeatherIcon
                          conditionId={day.weather[0].id}
                          isNight={isNight}
                          className="h-6 sm:h-8 w-6 sm:w-8 text-white"
                        />
                        <p className="text-sm leading-4">
                          {day.weather[0].description.charAt(0).toUpperCase() +
                            day.weather[0].description.slice(1)}
                        </p>
                      </div>

                      {/* Temps */}
                      <div className="font-bold ml-auto text-right sm:ml-0 self-end sm:self-center">
                        {Math.round(day.temp.max)}°<span className="font-normal">/</span>{Math.round(day.temp.min)}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>


          <div className="flex flex-col sm:flex-row gap-x-8 gap-y-10 mt-16 text-white text-sm leading-6 md:text-base md:leading-6">
            {/* Air & Atmosphere */}
            <div className="flex-1">
              <h3 className="mt-0 font-bold text-white text-sm text-left uppercase">
                Air &amp; Atmosphere
              </h3>
              <ul className="mt-4">
                <li className="datapoint flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {WindIcon && <WindIcon className="w-6 h-6 fill-white block shrink-0" />}
                    <span className="leading-6">Wind:</span>
                  </div>
                  <span className="leading-6 flex items-center whitespace-nowrap">
                    {weather.wind} {units === "imperial" ? "mph" : "m/s"}{" "}
                    {weather.windDeg ? `from ${weather.windDeg}°` : ""}
                  </span>
                </li>

                <li className="datapoint flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {PressureIcon && <PressureIcon className="w-6 h-6 fill-white block shrink-0" />}
                    <span className="leading-6">Pressure:</span>
                  </div>
                  <span className="leading-6 flex items-center whitespace-nowrap">
                    {weather.pressure} hPa
                  </span>
                </li>

                <li className="datapoint flex items-center justify-between border-none">
                  <div className="flex items-center gap-3">
                    {VisibilityIcon && <VisibilityIcon className="w-6 h-6 fill-white block shrink-0" />}
                    <span className="leading-6">Visibility:</span>
                  </div>
                  <span className="leading-6 flex items-center whitespace-nowrap">
                    {units === "imperial"
                      ? `${(weather.visibility * 0.000621371).toFixed(1)} mi`
                      : `${(weather.visibility / 1000).toFixed(1)} km`
                    }
                  </span>
                </li>
              </ul>
            </div>

            {/* Astronomy */}
            <div className="flex-1">
              <h3 className="mt-0 font-bold text-white text-sm text-left uppercase">
                Astronomy
              </h3>
              <ul className="mt-4">
                <li className="datapoint flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {SunriseIcon && <SunriseIcon className="w-6 h-6 fill-white block shrink-0" />}
                    <span className="leading-6">Sunrise:</span>
                  </div>
                  <span className="leading-6 flex items-center whitespace-nowrap">
                    {new Date(weather.sunrise * 1000).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </li>

                <li className="datapoint flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {SunsetIcon && <SunsetIcon className="w-6 h-6 fill-white block shrink-0" />}
                    <span className="leading-6">Sunset:</span>
                  </div>
                  <span className="leading-6 flex items-center whitespace-nowrap">
                    {new Date(weather.sunset * 1000).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </li>

                <MoonPhase moonPhase={weather?.moon_phase} />
              </ul>
            </div>
          </div>

          <footer className="p-4 mt-10">
            <p className="text-white text-sm text-center">Built by <a href="https://alissa.dev/">Alissa Bengtson</a></p>
          </footer>

        </div>
      )}

    </div>
  );
}
