import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Login() {
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const data = new FormData(e.currentTarget);

    try {
      const endpoint = isAdmin
        ? "/auth/admin/login"
        : "/auth/login";

      const response = await api.post(endpoint, {
        identifier: data.get("identifier"),
        password: data.get("password"),
      });

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError(
        isAdmin
          ? "Admin login failed. Check your administrator credentials."
          : "Unable to sign in. Check your credentials or account approval status."
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

