from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.database.base import Base

connect_args = {}
pool_kwargs = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL pooling parameters
    pool_kwargs = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600
    }

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **pool_kwargs,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
