import { useState } from "react";
import api from "@/config/api";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      // --- NEW LOGIC: Determine redirect path based on user role ---
      let redirectPath = "/"; // Default path for regular 'admin' users
      if (user.role === "super_admin") {
        redirectPath = "/admin"; // Special path for 'super_admin'
      }

      setError(null);
      // Return the redirectPath along with success status and user data
      return { success: true, user, redirectPath };
    } catch (err) {
      let errorMessage = "Login failed. Please check your credentials.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (!err.response) {
        errorMessage = "Cannot connect to the server.";
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

export default useLogin;
