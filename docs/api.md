# RECYCLINK REST API Specification

All endpoints are hosted by default on `http://localhost:8000`. Interactive OpenAPI documentation is accessible at `http://localhost:8000/docs`.

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Registers a new user (Collector, Recycler, or Admin).
- **Request Body**:
  ```json
  {
    "email": "collector@recyclink.in",
    "phone": "9876543210",
    "full_name": "Ramesh Kabadiwala",
    "password": "collector123",
    "role": "COLLECTOR",
    "city": "Hyderabad",
    "state": "Telangana",
    "area": "Banjara Hills"
  }
  ```
- **Response**: `200 OK` with JWT bearer token and user metadata.

### `POST /api/auth/login`
Authenticates a user using either email or phone number.
- **Request Body**:
  ```json
  {
    "username_or_phone": "collector@recyclink.in",
    "password": "collector123"
  }
  ```
- **Response**: `TokenResponse` with `access_token`, `role`, and `user_id`.

---

## 2. AI Material Scanner (`/api/ai`)

### `POST /api/ai/classify-material`
Modular computer vision inference endpoint for e-waste component recognition.
- **Request Body**:
  ```json
  {
    "sample_key": "pcb",
    "location": "Hyderabad"
  }
  ```
- **Response**:
  ```json
  {
    "detected_material": "PCB",
    "material_category": "PCB",
    "material_subcategory": "High-Grade Server & Telecom Board",
    "confidence": 0.94,
    "estimated_weight_kg": 2.4,
    "estimated_value_range": { "min": 420.0, "max": 520.0 },
    "recommended_fair_price": 455.0,
    "hazard_level": "MEDIUM",
    "recoverable_materials": ["Copper", "Gold", "Silver", "Palladium", "Tantalum"],
    "safety_summary": "Contains flame retardants and lead soldering. Do NOT heat over open flame."
  }
  ```

---

## 3. Fair Price Intelligence (`/api/pricing`)

### `POST /api/pricing/estimate`
Computes fair price ranges, regional adjustments, and ranks nearby recycler bids.
- **Request Body**:
  ```json
  {
    "material": "PCB",
    "weight_kg": 2.4,
    "location_city": "Hyderabad"
  }
  ```
- **Response**:
  ```json
  {
    "material": "PCB",
    "weight_kg": 2.4,
    "market_range_min_per_kg": 390.0,
    "market_range_max_per_kg": 480.0,
    "recommended_fair_price_per_kg": 455.0,
    "total_estimated_value": 1092.0,
    "assessment_tier": "FAIR",
    "nearby_recycler_offers": [
      {
        "recycler_name": "GreenCycle E-Waste Tech",
        "offer_rate_per_kg": 465.0,
        "distance_km": 4.2,
        "status_label": "GOOD OFFER"
      }
    ]
  }
  ```

---

## 4. E-Waste Lots & Circular Trace ID (`/api/lots` & `/api/trace`)

### `POST /api/lots`
Creates a traceable e-waste intake lot, generates QR code, and assigns `RC-2026-XXXXXX` Trace ID.
- **Request Body**:
  ```json
  {
    "material_name": "Printed Circuit Board (PCB)",
    "subcategory": "High-Grade Server Board",
    "weight_kg": 2.4,
    "quoted_price": 1092.0,
    "location_address": "Banjara Hills, Hyderabad"
  }
  ```

### `GET /api/trace/{trace_id}`
Returns complete immutable 7-stage chain of custody, QR verification code, actor details, and verified scale weights.

---

## 5. Transactions & Digital Handover (`/api/transactions`)

### `POST /api/transactions`
Creates transaction connecting lot to selected authorized recycler. Runs AI Guardian anomaly check.

### `POST /api/transactions/{id}/handover`
Digital Handover Verification:
- Compares certified scale weight against initial collector estimate.
- Flags weight discrepancies >25%.
- Confirms instant UPI disbursal.
- Ingests lot into `FORMAL_RECYCLING` stream under CPCB rules.

---

## 6. Admin & Government Analytics (`/api/admin`)

- `GET /api/admin/dashboard`: Formalization KPIs, avoided toxics, recovered precious metals.
- `GET /api/admin/analytics`: Trend curves for collection growth and material distribution.
- `GET /api/admin/hotspots`: GeoJSON nodes for collection hubs & recycler facilities.
- `GET /api/admin/anomalies`: Flagged predatory offers and weight mismatches.
