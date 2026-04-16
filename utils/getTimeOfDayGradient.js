/**
 * Maps OpenWeather condition codes to weather condition buckets
 */
function getConditionBucket(conditionId) {
    if (conditionId === 800) return "clear";
    if (conditionId === 801 || conditionId === 802) return "partly_cloudy";
    if (conditionId === 803 || conditionId === 804) return "overcast";
    if ((conditionId >= 200 && conditionId < 400) || (conditionId >= 500 && conditionId < 600)) {
        return "precipitation";
    }
    if (conditionId >= 600 && conditionId < 700) return "snow";
    if (conditionId >= 700 && conditionId < 800) return "atmosphere"; // treat like overcast
    return "clear"; // fallback
}

/**
 * Determines time period for gradient selection
 */
function getTimePeriod(now, sunrise, sunset) {
    const oneHour = 3600;
    const blueHourMorningStart = sunrise - oneHour;
    const goldenHourStart = sunset - oneHour;
    const blueHourEveningStart = sunset;
    const goldenHourEveningEnd = sunset + oneHour;

    if (now < blueHourMorningStart || now > goldenHourEveningEnd) {
        return "night"; // Deep night
    }
    if (now >= blueHourMorningStart && now < sunrise) {
        return "dawn"; // Blue hour morning
    }
    if (now >= sunrise && now < goldenHourStart) {
        return "day"; // Day / afternoon
    }
    if (now >= goldenHourStart && now < blueHourEveningStart) {
        return "golden"; // Golden hour
    }
    if (now >= blueHourEveningStart && now <= goldenHourEveningEnd) {
        return "dusk"; // Blue hour evening
    }
    return "night";
}

/**
 * Gradient matrix with all weather condition combinations
 * All gradients are dark enough for white text readability
 */
const gradientMatrix = {
    clear: {
        dawn: { gradient: "linear-gradient(to bottom, #1a1a2e, #a0704a, #b88a5a)" },
        day: { gradient: "linear-gradient(to bottom, #0f3a6b, #2a5a8b, #4a7aab)" },
        golden: { gradient: "linear-gradient(to bottom, #1a1040, #52203a, #7a3a20)" },
        dusk: { gradient: "linear-gradient(to bottom, #0f0c29, #302b63, #6b3fa0)" },
        night: { gradient: "linear-gradient(to bottom, #0a0a1a, #0d1b4b, #1a237e)" },
    },
    partly_cloudy: {
        dawn: { gradient: "linear-gradient(to bottom, #0d1b5c, #1a3a8a, #2050b0)" },
        day: { gradient: "linear-gradient(to bottom, #0d47a1, #1565c0, #1976d2)" },
        golden: { gradient: "linear-gradient(to bottom, #0d2060, #3a1a48, #683018)" },
        dusk: { gradient: "linear-gradient(to bottom, #080a28, #0d1b6e, #1a2e8a)" },
        night: { gradient: "linear-gradient(to bottom, #06080f, #0a1240, #0d1a60)" },
    },
    overcast: {
        dawn: { gradient: "linear-gradient(to bottom, #1a1a2a, #4a4a5a, #6a6a7a)" },
        day: { gradient: "linear-gradient(to bottom, #2a3040, #404858, #586070)" },
        golden: { gradient: "linear-gradient(to bottom, #1a1a2a, #3a3a4a, #4a4a5a)" },
        dusk: { gradient: "linear-gradient(to bottom, #080810, #101018, #181820)" },
        night: { gradient: "linear-gradient(to bottom, #050508, #08080f, #0f0f18)" },
    },
    precipitation: {
        dawn: { gradient: "linear-gradient(to bottom, #0f1520, #1e2d3d, #2d4055)" },
        day: { gradient: "linear-gradient(to bottom, #1e2d3d, #253d52, #2c4d66)" },
        golden: { gradient: "linear-gradient(to bottom, #0f1520, #1a2535, #243040)" },
        dusk: { gradient: "linear-gradient(to bottom, #080c12, #0f151e, #151e28)" },
        night: { gradient: "linear-gradient(to bottom, #050810, #080c15, #0c1218)" },
    },
    snow: {
        dawn: { gradient: "linear-gradient(to bottom, #1a2030, #3a5568, #5a7a90)" },
        day: { gradient: "linear-gradient(to bottom, #1a3a5a, #2a5a7a, #3a7a9a)" },
        golden: { gradient: "linear-gradient(to bottom, #1a2030, #3a4555, #6a7a8a)" },
        dusk: { gradient: "linear-gradient(to bottom, #0a0f18, #151e28, #252f3a)" },
        night: { gradient: "linear-gradient(to bottom, #080c15, #0f1520, #1a2030)" },
    },
    atmosphere: {
        dawn: { gradient: "linear-gradient(to bottom, #1a1a2a, #4a4a5a, #6a6a7a)" },
        day: { gradient: "linear-gradient(to bottom, #2a3040, #404858, #586070)" },
        golden: { gradient: "linear-gradient(to bottom, #1a1a2a, #3a3a4a, #4a4a5a)" },
        dusk: { gradient: "linear-gradient(to bottom, #080810, #101018, #181820)" },
        night: { gradient: "linear-gradient(to bottom, #050508, #08080f, #0f0f18)" },
    },
};

/**
 * Returns inline style object with weather-aware gradient
 */
export function getTimeOfDayGradient(now, sunrise, sunset, conditionId = 800) {
    const timePeriod = getTimePeriod(now, sunrise, sunset);
    const conditionBucket = getConditionBucket(conditionId);
    const entry =
        gradientMatrix[conditionBucket]?.[timePeriod] ||
        gradientMatrix.clear.night;

    return {
        backgroundImage: entry.gradient,
    };
}
