# Student routes - all the CRUD operations for students
# CRUD = Create, Read, Update, Delete

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

# All routes start with /students
router = APIRouter(prefix="/students", tags=["students"])


# CREATE - Add a new student
@router.post("", response_model=schemas.StudentOut, status_code=201, include_in_schema=False)
@router.post("/", response_model=schemas.StudentOut, status_code=201)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    # Check if the email is already used (emails must be unique)
    existing = db.query(models.Student).filter(models.Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the student record in the database
    db_student = models.Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


# READ - Get all students
@router.get("", response_model=List[schemas.StudentOut], include_in_schema=False)
@router.get("/", response_model=List[schemas.StudentOut])
def list_students(db: Session = Depends(get_db)):
    return db.query(models.Student).all()


# READ - Get one student by ID
@router.get("/{student_id}", response_model=schemas.StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


# UPDATE - Change a student's information
@router.put("/{student_id}", response_model=schemas.StudentOut)
def update_student(
    student_id: int,
    student: schemas.StudentUpdate,
    db: Session = Depends(get_db),
):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    # If email is being changed, ensure it's not already in use by another student
    if student.email is not None and student.email != db_student.email:
        conflict = db.query(models.Student).filter(
            models.Student.email == student.email,
            models.Student.id != student_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already registered")

    # Only update the fields that were actually provided
    update_data = student.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_student, key, value)

    db.commit()
    db.refresh(db_student)
    return db_student


# DELETE - Remove a student
@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return None   # 204 means "success, no content to return"
