# intern_project1

Student CRUD system with a FastAPI backend and a Vite + React + TypeScript frontend.

## Structure

```
intern_project1/
├── ewb-student-crud-api/        # BACKEND (FastAPI + SQLAlchemy + SQLite)
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── routers/
│   │       └── students.py
│   ├── tests/
│   └── requirements.txt
│
└── student-dashboard/           # FRONTEND (Vite + React + TypeScript)
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── api.ts
    │   └── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## Backend — Quick Start

```powershell
cd ewb-student-crud-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/students` | Create a student |
| GET | `/students` | List all students |
| GET | `/students/{id}` | Get a student by ID |
| PUT | `/students/{id}` | Update a student |
| DELETE | `/students/{id}` | Delete a student |

SQLite database file `students.db` is created automatically in the backend folder.

## Frontend — Quick Start

```powershell
cd student-dashboard
npm install
npm run dev
```

The dashboard runs on `http://localhost:5173` and calls the backend at `http://localhost:8000` (see `src/api.ts`).

Make sure the backend is running before using the dashboard.
