# RECYCLINK System Architecture Documentation

**Smart India Hackathon 2026 | Problem Statement: SIH26229**  
*“Kabadiwala Connect – Bringing the Informal Collector into the Formal Recycling Chain”*

---

## 1. Executive Summary

**RECYCLINK** is an intelligent industrial-grade informal-to-formal e-waste platform. It connects informal waste collectors (kabadiwalas) with state-authorized recycling facilities through transparent price discovery, automated material identification, and a tamper-evident circular trace ledger.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    RECYCLINK CLIENTS                                    |
|   +--------------------------+    +--------------------------+    +------------------+  |
|   |  Collector PWA (Mobile)  |    |  Recycler Portal (Admin) |    |  CPCB / Govt GIS |  |
|   |  - Big Touch Icons       |    |  - Lot Bids & Dispatch   |    |  - National KPIs |  |
|   |  - Audio & Trilingual    |    |  - Digital Handover      |    |  - Hazard Alerts |  |
|   |  - Offline IndexedDB     |    |  - Scale Reconciliation  |    |  - Hotspots Map  |  |
|   +--------------------------+    +--------------------------+    +------------------+  |
+-----------------------------------------------------------------------------------------+
                                             |
                         REST / JSON & JWT Bearer Security
                                             v
+-----------------------------------------------------------------------------------------+
|                               FASTAPI APPLICATION SERVER                                |
|  [ Routers: /api/auth | /api/collector | /api/ai | /api/pricing | /api/recyclers        |
|             /api/lots | /api/transactions | /api/trace | /api/admin | /api/safety ]     |
|  -------------------------------------------------------------------------------------  |
|                                MODULAR INTELLIGENCE ENGINES                             |
|   +--------------------------+    +--------------------------+    +------------------+  |
|   |  MaterialClassifier      |    |  PriceEstimator          |    | RecyclerMatcher  |  |
|   |  - CV Feature Inference  |    |  - CPCB Open Index       |    | - Geo Distance   |  |
|   |  - Hazard Assessment     |    |  - Regional Multipliers  |    | - Rating Score   |  |
|   |  - Precious Metals       |    |  - Dynamic Bid Tiers     |    | - Authorized Cert|  |
|   +--------------------------+    +--------------------------+    +------------------+  |
|   +----------------------------------------------------------------------------------+  |
|   |  AI Transaction Guardian (Anomaly Detection: predatory underpricing >40%, scales)|  |
|   +----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                             |
                               SQLAlchemy 2.0 ORM Engine
                                             v
+-----------------------------------------------------------------------------------------+
|                                    DATA PERSISTENCE                                     |
|   SQLite (Local zero-config fallback) / PostgreSQL Production Instance                   |
|   Tables: users, collectors, recyclers, materials, price_history, recycler_offers,       |
|           e_waste_lots, transactions, handover_records, trace_events, safety_guides,     |
|           anomaly_alerts, sync_queue, audit_logs                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Data Flow: 7-Stage Provenance Lifecycle

1. **COLLECTED**: Informal collector gathers electronic waste and creates an intake ticket.
2. **IDENTIFIED**: Modular AI Computer Vision evaluates component category, weight, and hazard level.
3. **PRICED**: Benchmark Pricing Engine calculates fair commodity value to protect collector margins.
4. **RECYCLER SELECTED**: Smart Matcher awards lot to the closest verified CPCB-licensed recycler.
5. **PICKUP SCHEDULED**: Logistics carrier dispatches GPS-tracked collection vehicle.
6. **HANDOVER VERIFIED**: Certified digital scale reading reconciles final weight, triggers anomaly guardian, and disburses instant UPI payment.
7. **FORMAL RECYCLING**: Material batched into closed-loop hydrometallurgical recovery with zero landfill leakage.
