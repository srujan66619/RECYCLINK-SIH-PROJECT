import math
from typing import Optional, Tuple

CITY_COORDINATES = {
    "hyderabad": (17.3850, 78.4867),
    "vijayawada": (16.5062, 80.6480),
    "guntur": (16.3067, 80.4365),
    "bapatla": (15.9042, 80.4674),
    "bengaluru": (12.9716, 77.5946),
    "mumbai": (19.0760, 72.8777),
    "pune": (18.5204, 73.8567),
    "delhi": (28.7041, 77.1025)
}

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class DistanceCalculator:
    @classmethod
    def calculate_distance(
        cls,
        collector_lat: Optional[float],
        collector_lon: Optional[float],
        recycler_lat: Optional[float],
        recycler_lon: Optional[float],
        collector_city: Optional[str] = None,
        recycler_city: Optional[str] = None
    ) -> Tuple[float, str]:
        """
        Calculates distance and returns (distance_km, distance_label).
        Uses GPS coordinates when available; falls back to city-level lookup.
        """
        # 1. Exact coordinates
        if collector_lat and collector_lon and recycler_lat and recycler_lon:
            km = haversine_km(collector_lat, collector_lon, recycler_lat, recycler_lon)
            return km, f"{km} km (GPS)"

        # 2. City fallback lookup
        c_city = (collector_city or "").strip().lower()
        r_city = (recycler_city or "").strip().lower()

        c_coords = CITY_COORDINATES.get(c_city)
        r_coords = CITY_COORDINATES.get(r_city)

        if c_coords and r_coords:
            km = haversine_km(c_coords[0], c_coords[1], r_coords[0], r_coords[1])
            # If same city, provide realistic intra-city scrap logistics radius
            if c_city == r_city:
                km = 4.2
            return km, f"~{km} km ({collector_city} to {recycler_city})"

        if c_city and r_city and c_city == r_city:
            return 5.0, f"~5.0 km (Local {collector_city})"

        # 3. Default regional estimate
        return 15.0, "~15.0 km (Regional Estimate)"
