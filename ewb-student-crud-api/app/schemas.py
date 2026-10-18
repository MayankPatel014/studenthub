# Pydantic schemas - these define the shape of data sent to/from the API
# They validate incoming data and control what gets returned

from pydantic import BaseModel, EmailStr
from typing import Optional


# Basic student info (shared by create and read operations)
class StudentBase(BaseModel):
    name: str
    email: EmailStr   # Automatically validates this is a real email format
    phone: Optional[str] = None
    course: str
    date_of_birth: Optional[str] = None


# Data needed to CREATE a new student
class StudentCreate(StudentBase):
    pass


# Data needed to UPDATE a student (all fields optional)
class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    course: Optional[str] = None
    date_of_birth: Optional[str] = None


# Data returned by the API (includes the database ID)
class StudentOut(StudentBase):
    id: int

    # Tells Pydantic to read data from SQLAlchemy model objects
    class Config:
        from_attributes = True
