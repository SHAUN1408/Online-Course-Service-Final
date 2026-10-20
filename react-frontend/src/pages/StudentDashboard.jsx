
import React, {
    useCallback,
    useContext,
    useEffect,
    useState,
  } from "react";
  
  import { UserContext } from "../context/UserContext.jsx";
  
  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";
  
  export default function StudentDashboard() {
    const { user, logout } = useContext(UserContext);
  
    const [courses, setCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [loggingOut, setLoggingOut] = useState(false);
  
    const loadCourses = useCallback(async () => {
      setLoading(true);
      setError("");
  
      try {
        const [courseResponse, userResponse] = await Promise.all([
          fetch(`${API_URL}/api/course`, {
            method: "GET",
            credentials: "include",
          }),
  
          fetch(`${API_URL}/api/user`, {
            method: "GET",
            credentials: "include",
          }),
        ]);
  
        const courseData = await courseResponse.json();
        const userData = await userResponse.json();
  
        if (!courseResponse.ok) {
          throw new Error(
            courseData.message || "Failed to load courses"
          );
        }
  
        if (!userResponse.ok) {
          throw new Error(
            userData.message || "Failed to load enrolled courses"
          );
        }
  
        setCourses(courseData.courses || []);
        setEnrolledCourses(userData.enrolledCourses || []);
      } catch (err) {
        setError(err.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    }, []);
  
    useEffect(() => {
      loadCourses();
    }, [loadCourses]);
  
    const handleEnroll = async (courseId) => {
      setBusyId(courseId);
      setError("");
      setMessage("");
  
      try {
        const response = await fetch(
          `${API_URL}/api/course/${courseId}/enroll`,
          {
            method: "POST",
            credentials: "include",
          }
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(
            data.message || "Enrollment failed"
          );
        }
  
        setMessage("Enrolled successfully!");
        await loadCourses();
      } catch (err) {
        setError(err.message);
      } finally {
        setBusyId(null);
      }
    };
  
    const handleLogout = async () => {
      setLoggingOut(true);
      setError("");
  
      try {
        await logout();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoggingOut(false);
      }
    };
  
    // Compare IDs so enrolled courses are not shown twice.
    const enrolledIds = new Set(
      enrolledCourses.map((course) => String(course._id))
    );
  
    const availableCourses = courses.filter(
      (course) =>
        course.status !== "Cancel" &&
        !enrolledIds.has(String(course._id))
    );
  
    const courseCard = (course, enrolled = false) => {
      const count =
        course.enrolledCount ??
        course.enrolledStudents?.length ??
        0;
  
      const full = count >= course.maxStudent;
  
      return (
        <div
          key={course._id}
          style={{
            padding: 20,
            border: "1px solid #e4d5ff",
            borderRadius: 12,
            background: "#fff",
          }}
        >
          <h3
            style={{
              color: "#4c1d95",
              marginBottom: 12,
            }}
          >
            {course.courseName}
          </h3>
  
          <p>Duration: {course.duration} hours</p>
          <p>Topics: {course.topics?.join(", ")}</p>
          <p>Price: {course.price}</p>
          <p>Status: {course.status}</p>
  
          {course.enrolledCount !== undefined ||
          Array.isArray(course.enrolledStudents) ? (
            <p>
              Students: {count}/{course.maxStudent}
            </p>
          ) : null}
  
          {enrolled ? (
            <>
              <p
                style={{
                  color: "#15803d",
                  fontWeight: 700,
                  marginTop: 12,
                }}
              >
                ✓ Enrolled
              </p>
  
              {course.status === "Cancel" && (
                <p
                  style={{
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  This course has been cancelled.
                </p>
              )}
            </>
          ) : (
            <button
              className="login-button"
              style={{
                maxWidth: 160,
                marginTop: 12,
              }}
              disabled={
                busyId === course._id ||
                course.status !== "Open" ||
                full
              }
              onClick={() => handleEnroll(course._id)}
            >
              {busyId === course._id
                ? "Enrolling..."
                : full
                  ? "Course Full"
                  : course.status !== "Open"
                    ? "Closed"
                    : "Enroll"}
            </button>
          )}
        </div>
      );
    };
  
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f0ff",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              marginBottom: 28,
            }}
          >
            <div>
              <h1
                style={{
                  color: "#4c1d95",
                  fontSize: 30,
                }}
              >
                Student Dashboard
              </h1>
  
              <p>
                Welcome, <strong>{user?.username}</strong>!
              </p>
  
              <p>{user?.email}</p>
            </div>
  
            <button
              className="login-button"
              style={{ maxWidth: 130 }}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </header>
  
          {error && (
            <p
              className="error-message"
              role="alert"
            >
              {error}
            </p>
          )}
  
          {message && (
            <p
              style={{
                color: "#15803d",
                marginBottom: 16,
              }}
            >
              {message}
            </p>
          )}
  
          {/* AVAILABLE COURSES */}
          <section
            style={{
              background: "white",
              borderRadius: 16,
              padding: 28,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
              }}
            >
              <h2 style={{ color: "#4c1d95" }}>
                Available Courses
              </h2>
  
              <button onClick={loadCourses}>
                Refresh
              </button>
            </div>
  
            {loading ? (
              <p>Loading courses...</p>
            ) : availableCourses.length === 0 ? (
              <p>No available courses found.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 16,
                  marginTop: 20,
                }}
              >
                {availableCourses.map((course) =>
                  courseCard(course)
                )}
              </div>
            )}
          </section>
  
          {/* ENROLLED COURSES */}
          <section
            style={{
              background: "white",
              borderRadius: 16,
              padding: 28,
            }}
          >
            <h2 style={{ color: "#4c1d95" }}>
              My Enrolled Courses
            </h2>
  
            {loading ? (
              <p>Loading enrolled courses...</p>
            ) : enrolledCourses.length === 0 ? (
              <p>
                You haven't enrolled in any courses yet.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 16,
                  marginTop: 20,
                }}
              >
                {enrolledCourses.map((course) =>
                  courseCard(course, true)
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }
  