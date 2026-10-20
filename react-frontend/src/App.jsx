import StudentDashboard from "./pages/StudentDashboard.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import "./App.css";
import React, { useContext } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { UserContext } from "./context/UserContext.jsx";

// LOGIN PAGE
function LoginPage() {
  const { login, user, loading } = useContext(UserContext);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="login-page">
        <p>Loading...</p>
      </main>
    );
  }

  if (user) {
    return (
      <Navigate
        to={user.role === "Teacher" ? "/teacher" : "/student"}
        replace
      />
    );
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1 className="login-title">
          Online Course Service
        </h1>

        <p className="login-subtitle">
          Welcome back! Please sign in to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>

            <input
              className="form-input"
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>

            <input
              className="form-input"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}

// PROTECTED ROUTE
function ProtectedRoute({ role, children }) {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <main className="login-page">
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return (
      <Navigate
        to={user.role === "Teacher" ? "/teacher" : "/student"}
        replace
      />
    );
  }

  return children;
}

// STUDENT AND TEACHER DASHBOARD
function Dashboard({ role }) {
  const { user, logout } = useContext(UserContext);
  const [error, setError] = React.useState("");
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setError("");
    setLoggingOut(true);

    try {
      await logout();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoggingOut(false);
    }
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
          maxWidth: 900,
          margin: "0 auto",
          padding: 32,
          background: "white",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(65,40,120,0.1)",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#4c1d95",
            marginBottom: 20,
          }}
        >
          {role} Dashboard
        </h1>

        <p style={{ marginBottom: 10 }}>
          Welcome, <strong>{user.username}</strong>!
        </p>

        <p style={{ marginBottom: 10 }}>
          Email: {user.email}
        </p>

        <p style={{ marginBottom: 24 }}>
          Role: {user.role}
        </p>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <button
          className="login-button"
          style={{ maxWidth: 180 }}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </main>
  );
}

// APPLICATION ROUTES
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="Teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute role="Student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </HashRouter>
  );
}
