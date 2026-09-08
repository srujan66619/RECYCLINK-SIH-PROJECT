from app.database.session import engine
from app.database.base import Base
# Import all models to ensure metadata is populated
import app.models

def init_db():
    Base.metadata.create_all(bind=engine)
