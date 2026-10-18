const API_BASE = "http://localhost:8000";

export type Student = {
  id: number;
  name: string;
  email: string;
  course: string;
  year: number;
  is_active: boolean;
};

export type StudentCreate = Omit<Student, "id">;
export type StudentUpdate = Partial<Omit<Student, "id">>;

export async function fetchStudents(): Promise<Student[]> {
  const res = await fetch(`${API_BASE}/students`);
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function createStudent(student: StudentCreate): Promise<Student> {
  const res = await fetch(`${API_BASE}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error("Failed to create student");
  return res.json();
}

export async function updateStudent(
  id: number,
  student: StudentUpdate
): Promise<Student> {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error("Failed to update student");
  return res.json();
}

export async function deleteStudent(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete student");
}
