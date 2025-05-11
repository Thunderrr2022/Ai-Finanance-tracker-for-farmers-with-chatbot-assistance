import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  
  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 });
  }

  try {
    // Check if we have an API key for OpenWeatherMap
    if (!process.env.WEATHER_API_KEY) {
      console.warn("WEATHER_API_KEY is not set, using fallback weather data");
      // Return fallback data for development
      return NextResponse.json({
        main: {
          temp: 22,
          humidity: 65
        },
        weather: [
          {
            main: "Clear",
            description: "clear sky"
          }
        ]
      });
    }
    
    const apiKey = process.env.WEATHER_API_KEY;
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    
    if (!response.ok) {
      console.warn(`Weather API responded with status: ${response.status}, using fallback data`);
      // Return fallback data if API fails
      return NextResponse.json({
        main: {
          temp: 22,
          humidity: 65
        },
        weather: [
          {
            main: "Clear",
            description: "clear sky"
          }
        ]
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Weather API error:", error);
    // Return fallback data if an error occurs
    return NextResponse.json({
      main: {
        temp: 22,
        humidity: 65
      },
      weather: [
        {
          main: "Clear",
          description: "clear sky"
        }
      ]
    });
  }
} 