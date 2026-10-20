
import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext.jsx";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const emptyForm = {
  courseName: "",
  duration: "",
  topics: "",
  price: "",
  maxStudent: "",
  status: "Open",
};

export default function TeacherDashboard() {
  const { user, logout } = useContext(UserContext);

  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // API REQUEST HELPER
  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }, []);

  // LOAD TEACHER COURSES
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);

      const data = await request("/api/course");
      setCourses(data.courses || []);

      return data.courses || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // UPDATE FORM FIELD
  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // RESET FORM
  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  // CREATE OR UPDATE COURSE
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const payload = {
      courseName: form.courseName.trim(),
      duration: Number(form.duration),
      topics: form.topics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
      price: Number(form.price),
      maxStudent: Number(form.maxStudent),
      status: form.status,
    };

    if (
      !payload.courseName ||
      !Number.isInteger(payload.duration) ||
      payload.duration <= 0 ||
      payload.topics.length === 0 ||
      !Number.isFinite(payload.price) ||
      payload.price < 0 ||
      !Number.isInteger(payload.maxStudent) ||
      payload.maxStudent <= 0
    ) {
      setError("Please enter valid course information.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await request(`/api/course/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setMessage("Course updated successfully!");
      } else {
        await request("/api/course", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage("Course created successfully!");
      }

      resetForm();
      await loadCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // EDIT COURSE
  const handleEdit = (course) => {
    setEditingId(course._id);

    setForm({
      courseName: course.courseName || "",
      duration: String(course.duration ?? ""),
      topics: (course.topics || []).join(", "),
      price: String(course.price ?? ""),
      maxStudent: String(course.maxStudent ?? ""),
      status: course.status || "Open",
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE COURSE
  const handleDelete = async (course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.courseName}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(course._id);

    try {
      await request(`/api/course/${course._id}`, {
        method: "DELETE",
      });

      if (editingId === course._id) {
        resetForm();
      }

      if (selectedCourse?._id === course._id) {
        setSelectedCourse(null);
        setStudents([]);
      }

      setMessage("Course deleted successfully!");

      window.alert("Course deleted successfully!");

      await loadCourses();
    } catch (err) {
      const errorMessage =
        err.message || "Failed to delete course.";

      setError(errorMessage);

      // Display the error immediately,
      // even when the user is scrolled down.
      window.alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  // VIEW ENROLLED STUDENTS
  const handleViewStudents = async (course) => {
    try {
      setError("");
      setMessage("");

      const data = await request(
        `/api/course/${course._id}`
      );

      setSelectedCourse(data.course || course);
      setStudents(data.students || []);
    } catch (err) {
      setError(err.message);
      window.alert(err.message);
    }
  };

  // CHANGE COURSE STATUS
  const handleStatusChange = async (course, status) => {
    setError("");
    setMessage("");

    try {
      await request(`/api/course/${course._id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      setMessage("Course status updated successfully!");

      await loadCourses();
    } catch (err) {
      setError(err.message);
      window.alert(err.message);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      setError("");
      await logout();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="teacher-page">
      <div className="teacher-container">

        {/* TEACHER HEADER */}
        <header className="teacher-header">
          <div>
            <h1>Teacher Dashboard</h1>

            <p>
              Welcome, <strong>{user?.username}</strong>!
            </p>

            <p>{user?.email}</p>
          </div>

          <button
            type="button"
            className="teacher-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <p className="teacher-error" role="alert">
            {error}
          </p>
        )}

        {/* SUCCESS MESSAGE */}
        {message && (
          <p className="teacher-success" role="status">
            {message}
          </p>
        )}

        {/* CREATE / EDIT COURSE */}
        <section className="teacher-card">
          <h2>
            {editingId ? "Edit Course" : "Create New Course"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="teacher-form-grid">

              <div>
                <label htmlFor="courseName">
                  Course Name
                </label>

                <input
                  id="courseName"
                  name="courseName"
                  value={form.courseName}
                  onChange={updateField}
                  placeholder="e.g. Web Development"
                  required
                />
              </div>

              <div>
                <label htmlFor="duration">
                  Duration (hours)
                </label>

                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  step="1"
                  value={form.duration}
                  onChange={updateField}
                  required
                />
              </div>

              <div>
                <label htmlFor="topics">
                  Topics (comma-separated)
                </label>

                <input
                  id="topics"
                  name="topics"
                  value={form.topics}
                  onChange={updateField}
                  placeholder="React, Next.js, MongoDB"
                  required
                />
              </div>

              <div>
                <label htmlFor="price">
                  Price
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={updateField}
                  required
                />
              </div>

              <div>
                <label htmlFor="maxStudent">
                  Maximum Students
                </label>

                <input
                  id="maxStudent"
                  name="maxStudent"
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxStudent}
                  onChange={updateField}
                  required
                />
              </div>

              <div>
                <label htmlFor="status">
                  Course Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={updateField}
                >
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                  <option value="Cancel">Cancel</option>
                </select>
              </div>

            </div>

            <div className="teacher-actions">
              <button
                className="teacher-primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Course"
                    : "Create Course"}
              </button>

              {editingId && (
                <button
                  className="teacher-secondary"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </form>
        </section>

        {/* MY COURSES */}
        <section className="teacher-card">
          <div className="teacher-section-header">
            <h2>My Courses</h2>

            <button
              type="button"
              className="teacher-secondary"
              onClick={loadCourses}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p>Loading courses...</p>
          ) : courses.length === 0 ? (
            <p>You haven't created any courses yet.</p>
          ) : (
            <div className="teacher-course-grid">
              {courses.map((course) => (
                <article
                  key={course._id}
                  className="teacher-course"
                >
                  <div className="teacher-section-header">
                    <h3>{course.courseName}</h3>

                    <span className="teacher-status">
                      {course.status}
                    </span>
                  </div>

                  <p>
                    <strong>Duration:</strong>{" "}
                    {course.duration} hours
                  </p>

                  <p>
                    <strong>Topics:</strong>{" "}
                    {(course.topics || []).join(", ")}
                  </p>

                  <p>
                    <strong>Price:</strong>{" "}
                    {course.price}
                  </p>

                  <p>
                    <strong>Capacity:</strong>{" "}
                    {course.enrolledCount ??
                      course.enrolledStudents?.length ??
                      0}
                    /{course.maxStudent}
                  </p>

                  {/* CHANGE STATUS */}
                  <div className="teacher-status-row">
                    <label
                      htmlFor={`status-${course._id}`}
                    >
                      Change Status
                    </label>

                    <select
                      id={`status-${course._id}`}
                      value={course.status}
                      onChange={(event) =>
                        handleStatusChange(
                          course,
                          event.target.value
                        )
                      }
                    >
                      <option value="Open">Open</option>
                      <option value="Close">Close</option>
                      <option value="Cancel">Cancel</option>
                    </select>
                  </div>

                  {/* COURSE ACTIONS */}
                  <div className="teacher-actions">
                    <button
                      type="button"
                      className="teacher-primary"
                      onClick={() => handleEdit(course)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="teacher-secondary"
                      onClick={() =>
                        handleViewStudents(course)
                      }
                    >
                      View Students
                    </button>

                    <button
                      type="button"
                      className="teacher-danger"
                      onClick={() => handleDelete(course)}
                      disabled={deletingId === course._id}
                    >
                      {deletingId === course._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ENROLLED STUDENTS */}
        {selectedCourse && (
          <section className="teacher-card">
            <div className="teacher-section-header">
              <h2>
                Enrolled Students —{" "}
                {selectedCourse.courseName}
              </h2>

              <button
                type="button"
                className="teacher-secondary"
                onClick={() => {
                  setSelectedCourse(null);
                  setStudents([]);
                }}
              >
                Close
              </button>
            </div>

            {students.length === 0 ? (
              <p>No students enrolled yet.</p>
            ) : (
              <ul className="teacher-student-list">
                {students.map((student) => (
                  <li key={student._id}>
                    <strong>
                      {student.username}
                    </strong>

                    <span>
                      {student.email}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

      </div>
    </main>
  );
}
