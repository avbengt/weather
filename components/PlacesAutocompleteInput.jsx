"use client";

import React, { useEffect, useRef, useState } from "react";
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import LocationIcon from "@/public/search.svg";

const libraries = ["places"];

export default function PlacesAutocompleteInput({
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onPlaceSelected,
}) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => inputRef.current?.focus(), 0);
            return () => clearTimeout(t);
        }
    }, [open]);

    const handlePlaceChanged = (ref) => {
        const place = ref?.getPlace?.();
        if (!place || !place.geometry) return;

        const lat = place.geometry.location.lat();
        const lon = place.geometry.location.lng();

        const components = place.address_components || [];

        const cityComponent = components.find(
            (c) =>
                c.types.includes("locality") ||
                c.types.includes("postal_town") ||
                c.types.includes("sublocality")
        );
        const stateComponent = components.find((c) =>
            c.types.includes("administrative_area_level_1")
        );
        const countryComponent = components.find((c) =>
            c.types.includes("country")
        );

        const cityName = cityComponent?.long_name || place.name || "";
        const state = stateComponent?.short_name || "";
        const country = countryComponent?.short_name || "";

        onPlaceSelected?.({
            name: cityName,
            state,
            country,
            lat,
            lon,
        });

        if (onChange) {
            const formattedInput = `${cityName}${state ? `, ${state}` : ""
                }${country && country !== "US" ? `, ${country}` : ""}`;
            onChange(formattedInput);
        }
    };

    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}
            libraries={libraries}
        >
            <div className="relative flex items-center">
                <button
                    type="button"
                    aria-label="Search for a city or ZIP"
                    onClick={() => setOpen((prev) => !prev)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 text-white/80 hover:text-white cursor-pointer"
                >
                    <LocationIcon className="w-7 h-7" />
                </button>

                <div className="w-full pl-10">
                    <Autocomplete
                        onLoad={(autocomplete) => (window.autocompleteRef = autocomplete)}
                        onPlaceChanged={() =>
                            handlePlaceChanged(window.autocompleteRef)
                        }
                        options={{
                            types: ["(regions)"],
                            componentRestrictions: { country: "us" },
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Enter city or ZIP"
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") setOpen(false);
                                onKeyDown?.(e);
                            }}
                            onFocus={(e) => {
                                setOpen(true);
                                onFocus?.(e);
                            }}
                            onBlur={(e) => {
                                setOpen(false);
                                onBlur?.(e);
                            }}
                            className={[
                                "w-full bg-transparent outline-none",
                                "border-0 border-b border-white/80 focus:border-white",
                                "text-white placeholder-white/70",
                                "py-1 text-sm md:text-base",
                                open
                                    ? "opacity-100 pointer-events-auto select-auto"
                                    : "opacity-0 pointer-events-none select-none",
                                "transition-opacity duration-200",
                            ].join(" ")}
                        />
                    </Autocomplete>
                </div>
            </div>
        </LoadScript>
    );
}