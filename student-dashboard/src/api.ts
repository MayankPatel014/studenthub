// API Client for the StudentHub Frontend
// Configures base URL and provides strongly-typed CRUD functions

export type Student = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  course: string;
  date_of_birth?: string | null;
  age?: number | null;
};

export type StudentCreateInput = {
  name: string;
  email: string;
  phone?: string | null;
  course: string;
  date_of_birth?: string | null;
};

export type StudentUpdateInput = Partial<StudentCreateInput>;

export const API_BASE = (
  (import.meta as { env?: { STUDENT_API_URL?: string; VITE_API_BASE_URL?: string } }).env?.STUDENT_API_URL
  || (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL
  || "http://127.0.0.1:8000"
).replace(/\/$/, "");

// Helper function to make API requests to the backend
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.detail) {
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((err: { msg?: string }) => err.msg || JSON.stringify(err)).join(", ");
        } else {
          message = JSON.stringify(data.detail);
        }
      }
    } catch {
      // Fallback to HTTP error
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Fetch all students
export async function getStudents(): Promise<Student[]> {
  const data = await request<Student[] | { items?: Student[]; students?: Student[] }>("/students");
  if (Array.isArray(data)) return data;
  return data.items ?? data.students ?? [];
}

// Fetch single student by ID
export async function getStudent(id: number | string): Promise<Student> {
  return request<Student>(`/students/${id}`);
}

// Create a new student
export async function createStudent(payload: StudentCreateInput): Promise<Student> {
  return request<Student>("/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Update existing student
export async function updateStudent(id: number | string, payload: StudentUpdateInput): Promise<Student> {
  return request<Student>(`/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Delete student
export async function deleteStudent(id: number | string): Promise<void> {
  await request<void>(`/students/${id}`, {
    method: "DELETE",
  });
}
