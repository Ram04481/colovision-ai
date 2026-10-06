import { FormEvent, useState } from "react";
import { api } from "../services/api";

export function Register() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("");
    setError("");

    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirm")) {
      return setError("Passwords do not match.");
    }

    try {
      const response = await api.post("/auth/register", Object.fromEntries(f));
      setNotice(response.data.message || "Your registration request has been submitted and is waiting for administrator approval.");
      e.currentTarget.reset();
    } catch (err: any) {
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || "Registration could not be completed. Please review your details.";
      setError(message);
    }
  }

  return (
    <section className="auth">
      <form className="form panel" onSubmit={submit}>
        <p className="eyebrow">CREATE ACCOUNT</p>
        <h1>Researcher registration</h1>
        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}
        <label>Full name<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Phone<input name="phone" required /></label>
        <label>Username<input name="username" required /></label>
        <label>Password<input name="password" type="password" minLength={8} required /></label>
        <label>Confirm password<input name="confirm" type="password" minLength={8} required /></label>
        <button className="button">Submit registration</button>
      </form>
    </section>
  );
}
