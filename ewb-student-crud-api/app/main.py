# EWB Student CRUD API
# A simple FastAPI backend for managing student records.
# Built as a student project - easy to read and understand.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import our database setup and the student routes
from .database import engine, Base
from .routers import students

# Create all database tables (this makes the students.db file)
Base.metadata.create_all(bind=engine)

# Create the FastAPI app
app = FastAPI(title="EWB Student CRUD API", version="1.0.0")

# Allow frontend dev servers (on any localhost/127.0.0.1 port) to call this API
# Without this, browsers block requests with CORS errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],   # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],   # Allow any headers
)

# Add student routes for both direct (/students) and api-prefixed (/api/students) paths
app.include_router(students.router)
app.include_router(students.router, prefix="/api")

# Simple home page to check if the API is running
@app.get("/")
def root():
    return {"message": "EWB Student CRUD API is running"}
