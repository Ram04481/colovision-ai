import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: "user" | "admin" | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, isAdmin: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<"user" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role") as "user" | "admin" | null;
    const userStr = localStorage.getItem("user");

    if (token && role) {
      setToken(token);
      setRole(role);
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch {
          localStorage.removeItem("user");
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string, isAdmin: boolean) => {
    const endpoint = isAdmin ? "/auth/admin/login" : "/auth/login";
    const response = await api.post(endpoint, { identifier, password });
    const token = response.data.access_token;
    const role = isAdmin ? "admin" : "user";

    localStorage.setItem("access_token", token);
    localStorage.setItem("role", role);
    setToken(token);
    setRole(role);

    // Fetch user info
    try {
      const userResponse = await api.get(isAdmin ? "/admin/profile" : "/profile");
      const userData = userResponse.data;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch {
      // If profile fetch fails, create minimal user object
      const userData = { id: 0, name: "", email: "", username: "", role: "user" as "user" | "admin" };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }

    return;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, role, isAuthenticated: !!token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}