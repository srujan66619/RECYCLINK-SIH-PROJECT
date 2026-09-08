# RECYCLINK Database Schema Documentation

RECYCLINK uses SQLAlchemy 2.0 with a local zero-configuration SQLite database (`recyclink.db`) for rapid hackathon testing and full compatibility with PostgreSQL in staging/production.

---

## Entity Relationship Overview

```
[User] (1) <---> (1) [CollectorProfile]
[User] (1) <---> (1) [RecyclerProfile]

[CollectorProfile] (1) <---> (N) [EWasteLot]
[EWasteLot] (1) <---> (1) [Transaction]
[RecyclerProfile] (1) <---> (N) [Transaction]

[Transaction] (1) <---> (1) [HandoverRecord]
[EWasteLot] (1) <---> (N) [TraceEvent]
[MaterialCategory] (1) <---> (N) [PriceHistory]
[MaterialCategory] (1) <---> (N) [RecyclerOffer]

[Transaction] (1) <---> (N) [AnomalyAlert]
```

---

## Core Tables Specification

### 1. `users`
- `id` (INT, PK)
- `email` (VARCHAR(255), UNIQUE)
- `phone` (VARCHAR(20), UNIQUE)
- `full_name` (VARCHAR(255))
- `role` (ENUM: `COLLECTOR`, `RECYCLER`, `ADMIN`)
- `hashed_password` (VARCHAR(255))
- `is_active` (BOOLEAN)
- `created_at` / `updated_at` (DATETIME)

### 2. `collectors`
- `id` (INT, PK)
- `user_id` (INT, FK `users.id`)
- `area`, `city`, `state`, `pincode` (VARCHAR)
- `upi_id` (VARCHAR)
- `total_collected_kg` (FLOAT)
- `total_earnings` (FLOAT)
- `rating` (FLOAT)
- `is_verified` (BOOLEAN)

### 3. `recyclers`
- `id` (INT, PK)
- `user_id` (INT, FK `users.id`)
- `facility_name` (VARCHAR)
- `authorization_no` (VARCHAR, UNIQUE)
- `authorization_status` (ENUM: `VERIFIED`, `PENDING`, `REJECTED`)
- `address`, `city`, `state`, `pincode` (VARCHAR)
- `latitude`, `longitude` (FLOAT)
- `accepted_materials` (JSON array)
- `pickup_available` (BOOLEAN)
- `service_radius_km` (FLOAT)
- `rating` (FLOAT)

### 4. `materials`
- `id` (INT, PK)
- `code` (VARCHAR, UNIQUE)
- `name`, `category`, `subcategory` (VARCHAR)
- `base_market_price_min`, `base_market_price_max` (FLOAT)
- `current_benchmark_price` (FLOAT)
- `hazard_level` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `recoverable_materials` (JSON array)

### 5. `e_waste_lots`
- `id` (INT, PK)
- `trace_id` (VARCHAR, UNIQUE) — e.g. `RC-2026-000184`
- `collector_id` (INT, FK `collectors.id`)
- `material_name`, `subcategory` (VARCHAR)
- `estimated_weight` (FLOAT)
- `final_weight` (FLOAT, NULLABLE)
- `ai_confidence` (FLOAT)
- `hazard_level` (VARCHAR)
- `recommended_price`, `quoted_price` (FLOAT)
- `status` (ENUM: `DRAFT`, `IDENTIFIED`, `PRICED`, `RECYCLER_SELECTED`, `PICKUP_SCHEDULED`, `HANDOVER_VERIFIED`, `FORMAL_RECYCLING`)
- `qr_code_url` (VARCHAR)

### 6. `transactions`
- `id` (INT, PK)
- `lot_id` (INT, FK `e_waste_lots.id`, UNIQUE)
- `collector_id` (INT, FK `collectors.id`)
- `recycler_id` (INT, FK `recyclers.id`)
- `agreed_price_per_kg` (FLOAT)
- `final_weight` (FLOAT)
- `total_amount` (FLOAT)
- `payment_status` (ENUM: `PENDING`, `PAID`, `FAILED`)
- `payment_ref` (VARCHAR)
- `status` (ENUM: `INITIATED`, `ACCEPTED`, `PICKUP_SCHEDULED`, `COMPLETED`, `REJECTED`)

### 7. `handover_records`
- `id` (INT, PK)
- `transaction_id` (INT, FK `transactions.id`, UNIQUE)
- `verified_weight` (FLOAT)
- `weight_discrepancy_pct` (FLOAT)
- `final_rate_per_kg` (FLOAT)
- `final_amount_paid` (FLOAT)
- `handover_timestamp` (DATETIME)
- `recycler_digital_signature` (VARCHAR)

### 8. `trace_events`
- `id` (INT, PK)
- `lot_id` (INT, FK `e_waste_lots.id`)
- `trace_id` (VARCHAR)
- `stage` (ENUM: `COLLECTED`, `IDENTIFIED`, `PRICED`, `RECYCLER_SELECTED`, `PICKUP_SCHEDULED`, `HANDOVER_VERIFIED`, `FORMAL_RECYCLING`)
- `title`, `description` (TEXT)
- `actor_role`, `actor_name` (VARCHAR)
- `location` (VARCHAR)
- `event_timestamp` (DATETIME)
- `metadata_json` (JSON)

### 9. `anomaly_alerts`
- `id` (INT, PK)
- `transaction_id`, `lot_id` (INT, NULLABLE)
- `alert_type` (VARCHAR) — `PREDATORY_PRICING`, `WEIGHT_MISMATCH`
- `severity` (ENUM: `WARNING`, `CRITICAL`)
- `description` (TEXT)
- `deviation_pct` (FLOAT)
- `benchmark_value`, `actual_value` (FLOAT)
- `status` (VARCHAR: `OPEN`, `REVIEWED`, `RESOLVED`)
