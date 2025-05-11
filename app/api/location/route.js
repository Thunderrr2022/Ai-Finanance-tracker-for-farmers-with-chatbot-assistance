import { NextResponse } from "next/server";

// Default location data (New York City)
const defaultLocation = {
  city: "New York City",
  region: "New York",
  country: "United States",
  coordinates: {
    lat: 40.7128,
    lon: -74.0060
  }
};

export async function GET() {
  try {
    // Use a more reliable free IP geolocation API
    try {
      const ipResponse = await fetch('https://ipapi.co/json/', { 
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
  
      if (ipResponse.ok) {
        const data = await ipResponse.json();
        
        return NextResponse.json({
          city: data.city || defaultLocation.city,
          region: data.region || defaultLocation.region,
          country: data.country_name || defaultLocation.country,
          coordinates: {
            lat: data.latitude || defaultLocation.coordinates.lat,
            lon: data.longitude || defaultLocation.coordinates.lon
          }
        });
      }
      
      console.warn(`Primary location API failed with status: ${ipResponse.status}`);
      
      // Try alternative API
      const fallbackResponse = await fetch('https://ipwho.is/', { 
        cache: 'no-store',
        signal: AbortSignal.timeout(3000)
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        
        return NextResponse.json({
          city: fallbackData.city || defaultLocation.city,
          region: fallbackData.region || defaultLocation.region,
          country: fallbackData.country || defaultLocation.country,
          coordinates: {
            lat: fallbackData.latitude || defaultLocation.coordinates.lat,
            lon: fallbackData.longitude || defaultLocation.coordinates.lon
          }
        });
      }
      
      throw new Error("All location APIs failed");
    } catch (fetchError) {
      console.error("Location API fetch error:", fetchError.message);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching location:", error.message);
    // Return default location on error
    return NextResponse.json(defaultLocation);
  }
} 