import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const endpoint = isAdmin
        ? "/auth/admin/login"
        : "/auth/login";

      const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8080/api"}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.get("identifier"),
          password: formData.get("password"),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Login failed");
      }

      const responseData = await response.json();
      localStorage.setItem("access_token", responseData.access_token);
      localStorage.setItem("role", isAdmin ? "admin" : "user");

      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(
        isAdmin
          ? "Admin login failed. Check your administrator credentials."
          : err.message || "Unable to sign in. Check your credentials or account approval status."
      );
    }
  }

  return (
    <section className="auth">
      <form className="form panel" onSubmit={submit}>
        <p className="eyebrow">
          {isAdmin ? "ADMINISTRATOR ACCESS" : "SECURE ACCESS"}
        </p>

        <h1>
          {isAdmin ? "Admin Login" : "Welcome back"}
        </h1>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <label>
          Email or username

          <input
            name="identifier"
            required
            autoComplete="username"
          />
        </label>

        <label>
          Password

          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>

        <button className="button" type="submit">
          {isAdmin ? "Admin Login" : "Login"}
        </button>

        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setIsAdmin(!isAdmin);
            setError("");
          }}
        >
          {isAdmin
            ? "Login as Doctor / User"
            : "Admin Login"}
        </button>

        {!isAdmin && (
          <p>
            Need an account?{" "}
            <Link to="/register">
              Register
            </Link>
          </p>
        )}
      </form>
    </section>
  );
}