# Database setup for the Student CRUD API
# Uses SQLite (a simple file-based database - no server needed)

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# The database file will be stored as students.db in the backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./students.db"

# Create the engine that connects to the database
# check_same_thread=False is needed for SQLite with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal is a factory for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that our database models will inherit from
Base = declarative_base()


# Dependency that gives each request its own database session
# The session is automatically closed after the request finishes
def get_db():
    db = SessionLocal()
    try:
        yield db   # Give the session to the route
    finally:
        db.close()   # Always close it when done
