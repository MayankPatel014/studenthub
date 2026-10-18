import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database import Base
from app.routers import students
from app import schemas, models


class TestStudentCrud(unittest.TestCase):
    def setUp(self):
        # Create an in-memory SQLite database for clean test isolation
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_create_and_list_students(self):
        # Create student
        created = students.create_student(
            schemas.StudentCreate(
                name="Alice Johnson",
                email="alice@example.com",
                phone="1234567890",
                course="Computer Science",
                date_of_birth="2000-01-15",
            ),
            self.db,
        )
        self.assertIsNotNone(created.id)
        self.assertEqual(created.name, "Alice Johnson")
        self.assertEqual(created.email, "alice@example.com")

        # List students
        all_students = students.list_students(self.db)
        self.assertEqual(len(all_students), 1)
        self.assertEqual(all_students[0].id, created.id)

    def test_duplicate_email_on_create_raises_400(self):
        students.create_student(
            schemas.StudentCreate(name="Alice", email="alice@example.com", course="CS"),
            self.db,
        )

        with self.assertRaises(HTTPException) as ctx:
            students.create_student(
                schemas.StudentCreate(name="Bob", email="alice@example.com", course="Math"),
                self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail, "Email already registered")

    def test_get_student_by_id(self):
        created = students.create_student(
            schemas.StudentCreate(name="Charlie", email="charlie@example.com", course="Physics"),
            self.db,
        )
        fetched = students.get_student(created.id, self.db)
        self.assertEqual(fetched.name, "Charlie")

        with self.assertRaises(HTTPException) as ctx:
            students.get_student(999, self.db)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_update_student_success(self):
        created = students.create_student(
            schemas.StudentCreate(name="Diana", email="diana@example.com", course="Art"),
            self.db,
        )

        updated = students.update_student(
            created.id,
            schemas.StudentUpdate(name="Diana Prince", course="Fine Arts"),
            self.db,
        )
        self.assertEqual(updated.name, "Diana Prince")
        self.assertEqual(updated.course, "Fine Arts")
        self.assertEqual(updated.email, "diana@example.com")

    def test_update_student_duplicate_email_raises_400(self):
        s1 = students.create_student(schemas.StudentCreate(name="S1", email="s1@example.com", course="CS"), self.db)
        s2 = students.create_student(schemas.StudentCreate(name="S2", email="s2@example.com", course="CS"), self.db)

        # Trying to update s2 with s1's email should fail cleanly with HTTP 400
        with self.assertRaises(HTTPException) as ctx:
            students.update_student(
                s2.id,
                schemas.StudentUpdate(email="s1@example.com"),
                self.db,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail, "Email already registered")

    def test_delete_student(self):
        created = students.create_student(
            schemas.StudentCreate(name="Evan", email="evan@example.com", course="History"),
            self.db,
        )
        res = students.delete_student(created.id, self.db)
        self.assertIsNone(res)

        # Verify it is deleted
        with self.assertRaises(HTTPException) as ctx:
            students.get_student(created.id, self.db)
        self.assertEqual(ctx.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
