import sqlite3
import os

def migrate_database(db_path: str = "recyclink.db"):
    if not os.path.exists(db_path):
        print(f"[Phase 7 Migration] Database {db_path} not found. Skipping.")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print(f"[Phase 7 Migration] Checking schema for {db_path}...")

    # 1. Update trace_events table
    trace_cols = [r[1] for r in cur.execute("PRAGMA table_info(trace_events)").fetchall()]
    new_trace_cols = [
        ("previous_event_hash", "TEXT"),
        ("event_hash", "TEXT"),
        ("latitude", "FLOAT"),
        ("longitude", "FLOAT"),
        ("location_accuracy", "FLOAT"),
        ("evidence_url", "TEXT"),
        ("event_status", "TEXT DEFAULT 'COMPLETED'"),
    ]
    for col_name, col_type in new_trace_cols:
        if col_name not in trace_cols:
            print(f"  Adding column {col_name} to trace_events")
            cur.execute(f"ALTER TABLE trace_events ADD COLUMN {col_name} {col_type}")

    # 2. Update handover_records table
    handover_cols = [r[1] for r in cur.execute("PRAGMA table_info(handover_records)").fetchall()]
    new_handover_cols = [
        ("handover_id", "TEXT"),
        ("material_name", "TEXT"),
        ("evidence_photo", "TEXT"),
        ("handover_location", "TEXT"),
        ("status", "TEXT DEFAULT 'VERIFIED'"),
        ("quoted_price", "FLOAT"),
        ("lot_id", "INTEGER"),
        ("recycler_id", "INTEGER"),
        ("collector_id", "INTEGER"),
    ]
    for col_name, col_type in new_handover_cols:
        if col_name not in handover_cols:
            print(f"  Adding column {col_name} to handover_records")
            cur.execute(f"ALTER TABLE handover_records ADD COLUMN {col_name} {col_type}")

    conn.commit()
    conn.close()
    print(f"[Phase 7 Migration] Schema migration completed successfully for {db_path}.")

if __name__ == "__main__":
    migrate_database("recyclink.db")
