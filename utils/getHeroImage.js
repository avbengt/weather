export function getHeroImage(conditionId, iconCode, windSpeed = 0) {
    if (!iconCode) return null; // or a fallback like "default.png"
    const isNight = iconCode.endsWith("n");

    if (conditionId === 800) {
        return isNight ? "clear-night.png" : "clear-day.png";
    }

    if (conditionId >= 200 && conditionId < 300) {
        return "thunderstorm.png";
    } else if (conditionId >= 300 && conditionId < 400) {
        return "drizzle.png";
    } else if (conditionId >= 500 && conditionId < 600) {
        return "rain.png";
    } else if (conditionId >= 600 && conditionId < 700) {
        return "snow.png";
    } else if (conditionId === 781) {
        return "tornado.png";
    } else if (conditionId >= 700 && conditionId < 800) {
        return "atmosphere.png"; // haze, fog, etc.
    } else if (conditionId === 803 || conditionId === 804) {
        return "cloudy.png"; // overcast
    } else if (conditionId > 800 && conditionId < 900) {
        return isNight ? "clouds-night.png" : "clouds-day.png";
    }

    if (windSpeed >= 10) {
        return "windy.png";
    }

    return "default.png"; // fallback image
}