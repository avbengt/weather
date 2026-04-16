export default async function fetchWeather(locationData, units = "imperial") {
  try {
    if (!locationData?.lat || !locationData?.lon) {
      console.error("Missing latitude or longitude in fetchWeather:", locationData);
      return { error: "Missing coordinates" };
    }

    const oneCallResponse = await fetch(
      `/api/onecall-weather?lat=${locationData.lat}&lon=${locationData.lon}&units=${units}`
    );

    const oneCallData = await oneCallResponse.json();
    console.log("Full One Call API response:", oneCallData);

    if (!oneCallData || oneCallData.cod === "400" || oneCallData.cod === "401" || oneCallData.cod === "404") {
      console.error("OpenWeather returned error:", oneCallData);
      return { error: oneCallData.message || "Weather data fetch failed." };
    }

    return {
      current: oneCallData.current,
      dailyForecast: oneCallData.daily?.slice(1, 8) || [],
      hourlyForecast: oneCallData.hourly?.slice(0, 12) || [],
      dewPoint: oneCallData.current?.dew_point || null,
      uvi: oneCallData.current?.uvi || null,
      moonPhase: oneCallData.daily?.[0]?.moon_phase || null,
      timezoneOffset: oneCallData.timezone_offset || 0,
    };
  } catch (error) {
    console.error("Fetch weather error:", error);
    return { error: "Failed to fetch weather data." };
  }
}