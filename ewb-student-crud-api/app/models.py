# Database model for a Student
# This defines what the "students" table looks like in the database

from sqlalchemy import Column, Integer, String
from .database import Base


class Student(Base):
    # The table name in the database
    __tablename__ = "students"

    # Each column in the table
    id = Column(Integer, primary_key=True, index=True)   # Unique ID (auto-generated)
    name = Column(String, nullable=False)                 # Student's full name
    email = Column(String, unique=True, index=True, nullable=False)  # Email (must be unique)
    phone = Column(String, nullable=True)                 # Phone number (optional)
    course = Column(String, nullable=False)               # Course they are studying
    date_of_birth = Column(String, nullable=True)         # Date of birth (optional)
