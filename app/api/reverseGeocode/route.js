export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
        return new Response(JSON.stringify({ error: "Missing lat/lon" }), { status: 400 });
    }

    try {
        const googleRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`
        );

        const data = await googleRes.json();

        // Check if Google API returned an error
        if (data.status && data.status !== "OK") {
            console.error("Google Geocoding API error:", data.status, data.error_message);
            return new Response(JSON.stringify({
                error: "Geocoding service unavailable",
                details: data.error_message || data.status
            }), {
                status: 503,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("Reverse geocoding API error:", error);
        return new Response(JSON.stringify({
            error: "Geocoding service unavailable",
            details: error.message
        }), {
            status: 503,
            headers: { "Content-Type": "application/json" }
        });
    }
}