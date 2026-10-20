
import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the logged-in user when the page refreshes.
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/user`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Authentication check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Log in as a Student or Teacher.
  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    setUser(data.user);
    return data.user;
  };

  // Log out and clear the authentication cookie.
  const logout = async () => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        isAuthenticated: Boolean(user),
        isTeacher: user?.role === "Teacher",
        isStudent: user?.role === "Student",
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
