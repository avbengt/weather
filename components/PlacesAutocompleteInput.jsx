"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { LoadScript } from "@react-google-maps/api";
import SearchIcon from "@/public/search.svg";

const libraries = ["places"];

function LocationPinIcon({ className }) {
    return (
        <svg
            viewBox="0 0 16 20"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M8 0C4.686 0 2 2.686 2 6c0 4.5 6 14 6 14s6-9.5 6-14c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </svg>
    );
}

export default function PlacesAutocompleteInput({
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onPlaceSelected,
}) {
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const attributionRef = useRef(null); // PlacesService needs a DOM node for attribution
    const autocompleteServiceRef = useRef(null);
    const placesServiceRef = useRef(null);
    const debounceRef = useRef(null);

    const [predictions, setPredictions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);

    // Lazily initialise both services once the Google Maps script is loaded
    const initServices = useCallback(() => {
        if (!window.google?.maps?.places) return;
        if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
        if (!placesServiceRef.current && attributionRef.current) {
            placesServiceRef.current = new window.google.maps.places.PlacesService(attributionRef.current);
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setPredictions([]);
                setActiveIndex(-1);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchPredictions = useCallback((input) => {
        if (!input || input.length < 2) {
            setPredictions([]);
            setIsOpen(false);
            return;
        }
        initServices();
        if (!autocompleteServiceRef.current) return;

        autocompleteServiceRef.current.getPlacePredictions(
            {
                input,
                types: ["(cities)"],
                language: "en",
            },
            (preds, status) => {
                if (
                    status === window.google.maps.places.PlacesServiceStatus.OK &&
                    preds?.length
                ) {
                    setPredictions(preds);
                    setIsOpen(true);
                    setActiveIndex(-1);
                } else {
                    setPredictions([]);
                    setIsOpen(false);
                }
            }
        );
    }, [initServices]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange?.(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPredictions(val), 200);
    };

    const selectPrediction = useCallback((prediction) => {
        initServices();
        if (!placesServiceRef.current) return;

        placesServiceRef.current.getDetails(
            {
                placeId: prediction.place_id,
                fields: ["geometry", "address_components", "name"],
            },
            (place, status) => {
                if (
                    status !== window.google.maps.places.PlacesServiceStatus.OK ||
                    !place?.geometry
                ) return;

                const lat = place.geometry.location.lat();
                const lon = place.geometry.location.lng();
                const components = place.address_components || [];

                // Use prediction's structured main text as first choice, then parse components
                let cityName = prediction.structured_formatting?.main_text;
                if (!cityName) {
                    // Fallback chain: locality → admin_area_level_2 → admin_area_level_1 → place.name → formatted_address
                    const localityComponent = components.find((c) =>
                        c.types.includes("locality")
                    );
                    const adminArea2Component = components.find((c) =>
                        c.types.includes("administrative_area_level_2")
                    );
                    const adminArea1Component = components.find((c) =>
                        c.types.includes("administrative_area_level_1")
                    );

                    cityName = localityComponent?.long_name ||
                        adminArea2Component?.long_name ||
                        adminArea1Component?.long_name ||
                        place.name ||
                        "";
                }

                const stateComponent = components.find((c) =>
                    c.types.includes("administrative_area_level_1")
                );
                const countryComponent = components.find((c) =>
                    c.types.includes("country")
                );

                const state = stateComponent?.short_name || "";
                const country = countryComponent?.short_name || "";

                onPlaceSelected?.({ name: cityName, state, country, lat, lon });

                const formattedInput = `${cityName}${state ? `, ${state}` : ""}${country && country !== "US" ? `, ${country}` : ""}`;
                onChange?.(formattedInput);

                setPredictions([]);
                setIsOpen(false);
                setActiveIndex(-1);
                inputRef.current?.blur();
            }
        );
    }, [initServices, onPlaceSelected, onChange]);

    const handleKeyDown = (e) => {
        if (!isOpen || !predictions.length) {
            onKeyDown?.(e);
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % predictions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? predictions.length - 1 : i - 1));
        } else if (e.key === "Enter") {
            if (activeIndex >= 0 && predictions[activeIndex]) {
                e.preventDefault();
                selectPrediction(predictions[activeIndex]);
            } else {
                onKeyDown?.(e);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setIsOpen(false);
            setPredictions([]);
            setActiveIndex(-1);
            inputRef.current?.blur();
        } else {
            onKeyDown?.(e);
        }
    };

    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}
            libraries={libraries}
        >
            {/* Hidden node that PlacesService uses to render its attribution */}
            <div
                ref={attributionRef}
                style={{ position: "absolute", visibility: "hidden", height: 0, width: 0, overflow: "hidden" }}
                aria-hidden="true"
            />

            <div ref={containerRef} className="relative">

                {/* Search pill */}
                <div
                    className="relative flex items-center w-full bg-white/10 rounded-full px-4 py-2.5 border border-white/20 focus-within:border-white/40 transition-colors cursor-text"
                    onClick={() => inputRef.current?.focus()}
                >
                    <SearchIcon className="w-4 h-4 text-white/50 shrink-0 mr-3 fill-white/50" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search city or ZIP..."
                        value={value}
                        autoComplete="off"
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={(e) => {
                            e.target.select();
                            onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            onBlur?.(e);
                        }}
                        className="w-full bg-transparent outline-none text-white placeholder-white/40 text-sm"
                    />
                </div>

                {/* Custom suggestions dropdown */}
                {isOpen && predictions.length > 0 && (
                    <div
                        className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-2xl"
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            border: "0.5px solid rgba(255,255,255,0.2)",
                            animation: "dropdownFadeIn 150ms ease forwards",
                        }}
                    >
                        {predictions.map((prediction, i) => {
                            const main = prediction.structured_formatting?.main_text ?? prediction.description;
                            const secondary = prediction.structured_formatting?.secondary_text;
                            return (
                                <div
                                    key={prediction.place_id}
                                    onMouseDown={(e) => {
                                        // preventDefault keeps focus on the input so onBlur
                                        // doesn't fire before selectPrediction completes
                                        e.preventDefault();
                                        selectPrediction(prediction);
                                    }}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${i === activeIndex
                                            ? "bg-white/[0.18]"
                                            : "hover:bg-white/[0.12]"
                                        }`}
                                >
                                    <LocationPinIcon className="w-3 h-3.5 text-white/40 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-sm font-medium truncate leading-tight">
                                            {main}
                                        </span>
                                        {secondary && (
                                            <span className="text-white/55 text-xs truncate leading-tight mt-0.5">
                                                {secondary}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Google attribution — required by ToS */}
                        <div className="px-4 py-1.5 flex justify-end border-t border-white/10">
                            <span className="text-white/35 text-[10px]">powered by Google</span>
                        </div>
                    </div>
                )}

            </div>
        </LoadScript>
    );
}
