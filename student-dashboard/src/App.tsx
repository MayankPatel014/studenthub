import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode, type SVGProps } from "react";

// ============================================================================
// TYPES
// These define the shape of our data
// ============================================================================

type Student = {
  id: number | string;
  name: string;
  date_of_birth?: string | null;
  email: string;
  phone: string;
  course: string;
  age?: number | null;
};

type StudentForm = {
  name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  course: string;
};

// The four pages/views of the dashboard
type View = "overview" | "students" | "courses" | "reports";

// ============================================================================
// API SETTINGS
// ============================================================================

// The backend API address (can be changed with an environment variable)
const API_BASE = (
  (import.meta as { env?: { STUDENT_API_URL?: string; VITE_API_BASE_URL?: string } }).env?.STUDENT_API_URL
  || (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL
  || "http://127.0.0.1:8000"
).replace(/\/$/, "");

// Empty form values (used when creating a new student)
const emptyForm: StudentForm = { name: "", date_of_birth: "", email: "", phone: "", course: "" };

// Helper function to make API requests to the backend
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.detail
        ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
        : message;
    } catch { /* Keep the HTTP error message. */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Calculate age from date of birth
function getAge(dob?: string | null) {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

// Get initials from a name (e.g. "John Doe" -> "JD")
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("") || "ST";
}

// Simple SVG icon component
function Icon({ name }: { name: string }) {
  const common: SVGProps<SVGSVGElement> = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1)"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    arrow: <><path d="M5 12h14m-7-7 7 7-7 7"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  };
  return <svg {...common}>{paths[name] ?? paths.grid}</svg>;
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  // --- State variables ---
  const [students, setStudents] = useState<Student[]>([]);     // List of all students
  const [loading, setLoading] = useState(true);                 // Are we loading data?
  const [error, setError] = useState("");                        // Error message (if any)
  const [notice, setNotice] = useState("");                     // Success message (if any)
  const [query, setQuery] = useState("");                       // Search text
  const [courseFilter, setCourseFilter] = useState("all");      // Selected course filter
  const [page, setPage] = useState(1);                          // Current page number
  const [pageSize, setPageSize] = useState(8);                  // Students per page
  const [modalOpen, setModalOpen] = useState(false);            // Is the add/edit form open?
  const [editing, setEditing] = useState<Student | null>(null); // Student being edited (null = creating new)
  const [deleting, setDeleting] = useState<Student | null>(null); // Student being deleted
  const [form, setForm] = useState<StudentForm>(emptyForm);     // Form input values
  const [saving, setSaving] = useState(false);                  // Is the form being saved?
  const [dark, setDark] = useState(false);                      // Dark mode on/off
  const [mobileNav, setMobileNav] = useState(false);            // Mobile menu open/closed
  const [currentView, setCurrentView] = useState<View>("overview"); // Current page

  // Labels and icons for each view
  const VIEW_LABELS: Record<View, string> = {
    overview: "Overview",
    students: "Students",
    courses: "Courses",
    reports: "Reports",
  };

  // Switch to a different view/page
  const setView = (view: View) => {
    setCurrentView(view);
    setMobileNav(false);
  };

  // ============================================================================
  // LOAD STUDENTS FROM API
  // ============================================================================

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request<Student[] | { items?: Student[]; students?: Student[] }>("/students/");
      const list = Array.isArray(data) ? data : data.items ?? data.students ?? [];
      setStudents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load students when the app first loads
  useEffect(() => { void loadStudents(); }, [loadStudents]);

  // ============================================================================
  // DERIVED DATA (computed from the students list)
  // ============================================================================

  // List of unique courses (for the filter dropdown)
  const courses = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))].sort(), [students]);

  // Students that match the search and course filter
  const filtered = useMemo(() => students.filter(s => {
    const searchMatch = `${s.name} ${s.email} ${s.phone} ${s.course} ${s.id}`.toLowerCase().includes(query.toLowerCase().trim());
    return searchMatch && (courseFilter === "all" || s.course === courseFilter);
  }), [students, query, courseFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleStudents = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Course statistics (for the courses page)
  const courseCounts = useMemo(() => courses.map(course => ({
    course, count: students.filter(s => s.course === course).length,
  })).sort((a, b) => b.count - a.count).slice(0, 4), [courses, students]);

  // Most recently added students (for the reports page)
  const recentStudents = [...students].slice(-4).reverse();

  // Dashboard statistics
  const totalStudents = students.length;
  const contactComplete = students.length
    ? Math.round(students.filter(s => s.email && s.phone).length / students.length * 100)
    : 0;

  const viewTitle = VIEW_LABELS[currentView];

  // ============================================================================
  // FORM ACTIONS (Add / Edit student)
  // ============================================================================

  // Open the form to create a new student
  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  // Open the form to edit an existing student
  function openEdit(student: Student) {
    setEditing(student);
    setForm({
      name: student.name ?? "",
      date_of_birth: student.date_of_birth?.slice(0, 10) ?? "",
      email: student.email ?? "",
      phone: student.phone ?? "",
      course: student.course ?? "",
    });
    setModalOpen(true);
  }

  // Save the form (create or update)
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      date_of_birth: form.date_of_birth || null,
      email: form.email.trim(),
      phone: form.phone.trim(),
      course: form.course.trim(),
    };

    try {
      if (editing) {
        // Update existing student
        await request(`/students/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        setNotice("Student details updated successfully.");
      } else {
        // Create new student
        await request("/students/", { method: "POST", body: JSON.stringify(payload) });
        setNotice("Student added successfully.");
      }
      setModalOpen(false);
      await loadStudents();   // Refresh the list
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save student.");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================================
  // DELETE STUDENT
  // ============================================================================

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await request(`/students/${deleting.id}`, { method: "DELETE" });
      setStudents(old => old.filter(s => s.id !== deleting.id));
      setNotice(`${deleting.name} was deleted.`);
      setDeleting(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete student.");
      setDeleting(null);
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={dark ? "app-shell dark" : "app-shell"}>
      {/* Mobile menu scrim (dark overlay when menu is open on phones) */}
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      {/* ================= SIDEBAR ================= */}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <a className="brand" href="#" onClick={e => e.preventDefault()}>
          <span className="brand-mark"><Icon name="book" /></span>
          <span>student<span className="brand-light">hub</span><small>MANAGEMENT PORTAL</small></span>
        </a>

        <div className="nav-label">WORKSPACE</div>

        <nav className="side-nav" aria-label="Main navigation">
          <a
            className={`nav-item ${currentView === "overview" ? "active" : ""}`}
            href="#overview"
            onClick={(e) => { e.preventDefault(); setView("overview"); }}
          ><Icon name="grid"/> Overview</a>

          <a
            className={`nav-item ${currentView === "students" ? "active" : ""}`}
            href="#students"
            onClick={(e) => { e.preventDefault(); setView("students"); }}
          ><Icon name="users"/> Students <span className="nav-count">{students.length}</span></a>

          <a
            className={`nav-item ${currentView === "courses" ? "active" : ""}`}
            href="#courses"
            onClick={(e) => { e.preventDefault(); setView("courses"); }}
          ><Icon name="book"/> Courses</a>

          <a
            className={`nav-item ${currentView === "reports" ? "active" : ""}`}
            href="#reports"
            onClick={(e) => { e.preventDefault(); setView("reports"); }}
          ><Icon name="chart"/> Reports</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>Need a hand?</strong>
            <p>Your student records, all in one place.</p>
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">API documentation <Icon name="arrow"/></a>
          </div>
          <button className="nav-item settings-link" onClick={() => setNotice("Settings are coming soon.")}><Icon name="settings"/> Settings</button>
          <div className="sidebar-user">
            <div className="user-avatar">SH</div>
            <div><strong>StudentHub Admin</strong><small>Workspace</small></div>
            <span className="online-dot"/>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Icon name="menu"/></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{viewTitle}</strong></div>
          <div className="topbar-actions">
            <div className="api-status"><span className={`status-dot ${error ? "status-error" : loading ? "status-loading" : "status-ok"}`}/>{error ? "Connection issue" : loading ? "Connecting…" : "API connected"}</div>
            <button className="icon-button" title={dark ? "Switch to light mode" : "Switch to dark mode"} aria-label="Toggle theme" onClick={() => setDark(v => !v)}><Icon name={dark ? "sun" : "moon"}/></button>
            <div className="top-avatar">MA</div>
          </div>
        </header>

        <div className="page-content">

          {/* ---------- OVERVIEW PAGE ---------- */}
          {currentView === "overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line"/> STUDENT MANAGEMENT</div>
                  <h1>Your campus, <span>at a glance.</span></h1>
                  <p className="page-subtitle">Manage student records with clarity and confidence.</p>
                </div>
                <button className="primary-button" onClick={openCreate}><Icon name="plus"/> Add student</button>
              </section>

              {notice && <div className="notice success-notice" role="status"><span>✓</span>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><Icon name="close"/></button></div>}
              {error && <div className="notice error-notice" role="alert"><span>!</span><div><strong>Something needs your attention</strong><p>{error}</p><button className="text-button" onClick={() => void loadStudents()}>Try again</button></div><button aria-label="Dismiss error" onClick={() => setError("")}><Icon name="close"/></button></div>}

              <section className="stats-grid" aria-label="Student statistics">
                <article className="stat-card"><div className="stat-top"><span className="stat-icon violet"><Icon name="users"/></span><span className="stat-kicker">ALL RECORDS</span></div><div className="stat-number">{loading ? "—" : totalStudents.toLocaleString()}</div><div className="stat-footer"><strong>Total students</strong><span className="stat-note">In your database</span></div><div className="stat-decoration decoration-violet"/></article>
                <article className="stat-card"><div className="stat-top"><span className="stat-icon teal"><Icon name="book"/></span><span className="stat-kicker">LEARNING</span></div><div className="stat-number">{loading ? "—" : courses.length}</div><div className="stat-footer"><strong>Unique courses</strong><span className="stat-note">Across student records</span></div><div className="stat-decoration decoration-teal"/></article>
                <article className="stat-card"><div className="stat-top"><span className="stat-icon amber"><Icon name="chart"/></span><span className="stat-kicker">CONTACT DATA</span></div><div className="stat-number">{loading ? "—" : `${contactComplete}%`}</div><div className="stat-footer"><strong>Contact completeness</strong><span className="stat-note">Email + phone available</span></div><div className="stat-decoration decoration-amber"/></article>
                <article className="stat-card stat-card-accent"><div className="stat-top"><span className="stat-icon accent-icon"><Icon name="plus"/></span><span className="stat-kicker">QUICK ACTION</span></div><div className="quick-title">Add someone new?</div><p className="quick-description">Keep your student directory up to date.</p><button className="quick-link" onClick={openCreate}>Create student <Icon name="arrow"/></button></article>
              </section>
            </>
          )}

          {/* ---------- STUDENTS PAGE ---------- */}
          {currentView === "students" && (
            <section className="content-grid" style={{ gridTemplateColumns: "1fr" }}>
              <article className="panel student-panel">
                <div className="panel-heading">
                  <div><div className="panel-title-row"><h2>Student directory</h2><span className="count-pill">{filtered.length}</span></div><p>Browse and manage your student records.</p></div>
                  <button className="secondary-button" onClick={() => void loadStudents()} disabled={loading}>↻ <span>Refresh</span></button>
                </div>

                <div className="table-toolbar">
                  <label className="search-box"><Icon name="search"/><input value={query} onChange={e => {setQuery(e.target.value); setPage(1);}} placeholder="Search students..." aria-label="Search students"/></label>
                  <select className="filter-select" value={courseFilter} onChange={e => {setCourseFilter(e.target.value); setPage(1);}} aria-label="Filter by course">
                    <option value="all">All courses</option>
                    {courses.map(course => <option key={course} value={course}>{course}</option>)}
                  </select>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead><tr><th>STUDENT</th><th>CONTACT</th><th>COURSE</th><th>AGE</th><th className="actions-heading">ACTIONS</th></tr></thead>
                    <tbody>
                      {loading && Array.from({length: 4}, (_, i) => <tr key={`loading-${i}`}><td colSpan={5}><div className="skeleton-row"><span/><span/><span/></div></td></tr>)}
                      {!loading && visibleStudents.map((student, index) => <tr key={student.id}>
                        <td><div className="student-cell"><div className={`student-avatar avatar-${index % 5}`}>{initials(student.name)}</div><div className="student-identity"><strong>{student.name}</strong><span>ID #{student.id}</span></div></div></td>
                        <td><div className="contact-cell"><span>{student.email}</span><small>{student.phone}</small></div></td>
                        <td><span className="course-badge">{student.course || "Unassigned"}</span></td>
                        <td><span className="age-value">{student.age ?? getAge(student.date_of_birth) ?? "—"}</span></td>
                        <td><div className="row-actions"><button className="row-action edit-action" onClick={() => openEdit(student)} aria-label={`Edit ${student.name}`} title="Edit"><Icon name="edit"/></button><button className="row-action delete-action" onClick={() => setDeleting(student)} aria-label={`Delete ${student.name}`} title="Delete"><Icon name="trash"/></button></div></td>
                      </tr>)}
                      {!loading && visibleStudents.length === 0 && <tr><td colSpan={5}><div className="empty-state"><span className="empty-icon"><Icon name="users"/></span><strong>{students.length ? "No students found" : "Your directory is empty"}</strong><p>{students.length ? "Try a different search or clear your filters." : "Add your first student to get started."}</p>{students.length ? <button className="secondary-button" onClick={() => {setQuery("");setCourseFilter("all");}}>Clear filters</button> : <button className="primary-button" onClick={openCreate}><Icon name="plus"/> Add first student</button>}</div></td></tr>}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> students</span>
                  <div className="pagination">
                    <select value={pageSize} onChange={e => {setPageSize(Number(e.target.value));setPage(1);}} aria-label="Rows per page">
                      <option value={5}>5 / page</option>
                      <option value={8}>8 / page</option>
                      <option value={15}>15 / page</option>
                    </select>
                    <button disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">‹</button>
                    <span>{currentPage} / {totalPages}</span>
                    <button disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">›</button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* ---------- COURSES PAGE ---------- */}
          {currentView === "courses" && (
            <section className="content-grid" style={{ gridTemplateColumns: "1fr" }}>
              <article className="panel course-panel">
                <div className="panel-heading compact-heading"><div><h2>Course overview</h2><p>Students by course</p></div><span className="mini-icon"><Icon name="chart"/></span></div>
                {courseCounts.length ? <div className="course-list">{courseCounts.map((item, i) => <div className="course-item" key={item.course}><div className="course-item-top"><span className="course-dot" style={{background:["#7667E8","#20A695","#E9A23B","#E879A9"][i % 4]}}/><span className="course-name">{item.course}</span><strong>{item.count}</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${totalStudents ? item.count / totalStudents * 100 : 0}%`,background:["#7667E8","#20A695","#E9A23B","#E879A9"][i % 4]}}/></div></div>)}</div> : <div className="small-empty">Course data will appear when students are added.</div>}
                <div className="panel-bottom-note"><span className="note-check">✓</span> Based on loaded student records</div>
              </article>
            </section>
          )}

          {/* ---------- REPORTS PAGE ---------- */}
          {currentView === "reports" && (
            <section className="content-grid" style={{ gridTemplateColumns: "1fr" }}>
              <article className="panel recent-panel">
                <div className="panel-heading compact-heading"><div><h2>Recently listed</h2><p>Latest records returned by the API</p></div><span className="mini-icon"><Icon name="users"/></span></div>
                {recentStudents.length ? <div className="recent-list">{recentStudents.map((student, i) => <div className="recent-item" key={student.id}><div className={`student-avatar avatar-${i % 5}`}>{initials(student.name)}</div><div className="recent-identity"><strong>{student.name}</strong><span>{student.course || "No course assigned"}</span></div><button className="recent-open" aria-label={`Edit ${student.name}`} onClick={() => openEdit(student)}>↗</button></div>)}</div> : <div className="small-empty">Your recent students will appear here.</div>}
                <button className="view-all-button" onClick={() => setView("students")}>View directory <Icon name="arrow"/></button>
              </article>

              <article className="panel course-panel" style={{ marginTop: 24 }}>
                <div className="panel-heading compact-heading"><div><h2>Course distribution</h2><p>Students enrolled per course</p></div><span className="mini-icon"><Icon name="chart"/></span></div>
                {courseCounts.length ? <div className="course-list">{courseCounts.map((item, i) => <div className="course-item" key={item.course}><div className="course-item-top"><span className="course-dot" style={{background:["#7667E8","#20A695","#E9A23B","#E879A9"][i % 4]}}/><span className="course-name">{item.course}</span><strong>{item.count}</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${totalStudents ? item.count / totalStudents * 100 : 0}%`,background:["#7667E8","#20A695","#E9A23B","#E879A9"][i % 4]}}/></div></div>)}</div> : <div className="small-empty">Course data will appear when students are added.</div>}
                <div className="panel-bottom-note"><span className="note-check">✓</span> Based on loaded student records</div>
              </article>
            </section>
          )}

        </div>
      </main>

      {/* ================= ADD/EDIT MODAL ================= */}
      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => {if (e.target === e.currentTarget) setModalOpen(false);}}>
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
          <div className="modal-header"><div><span className="modal-eyebrow">{editing ? "UPDATE RECORD" : "NEW RECORD"}</span><h2 id="student-modal-title">{editing ? "Edit student" : "Add a student"}</h2><p>{editing ? "Update the student's information below." : "Fill in the details to create a student record."}</p></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close dialog"><Icon name="close"/></button></div>
          <form onSubmit={submitForm}>
            <div className="form-grid">
              <label className="form-field full-field"><span>Full name <b>*</b></span><input autoFocus required minLength={2} maxLength={100} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Aanya Sharma"/></label>
              <label className="form-field"><span>Email address <b>*</b></span><input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="name@example.com"/></label>
              <label className="form-field"><span>Phone number <b>*</b></span><input required type="tel" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="Enter phone number"/></label>
              <label className="form-field"><span>Date of birth</span><input type="date" value={form.date_of_birth} max={new Date().toISOString().slice(0,10)} onChange={e => setForm({...form,date_of_birth:e.target.value})}/></label>
              <label className="form-field"><span>Course <b>*</b></span><input required value={form.course} onChange={e => setForm({...form,course:e.target.value})} placeholder="e.g. Computer Science"/></label>
              {form.date_of_birth && <div className="age-preview"><span>Calculated age</span><strong>{getAge(form.date_of_birth) ?? "Check date of birth"}</strong></div>}
            </div>
            <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <span className="button-spinner"/> : <Icon name="plus"/>}{saving ? "Saving…" : editing ? "Save changes" : "Create student"}</button></div>
          </form>
        </section>
      </div>}

      {/* ================= DELETE CONFIRMATION ================= */}
      {deleting && <div className="modal-backdrop" role="presentation" onMouseDown={e => {if(e.target === e.currentTarget) setDeleting(null);}}><section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><div className="delete-symbol"><Icon name="trash"/></div><h2 id="delete-title">Delete this student?</h2><p>This will permanently remove <strong>{deleting.name}</strong> from your student directory. This action cannot be undone.</p><div className="modal-footer"><button className="secondary-button" onClick={() => setDeleting(null)}>Keep student</button><button className="danger-button" onClick={() => void confirmDelete()}>Delete student</button></div></section></div>}
    </div>
  );
}
