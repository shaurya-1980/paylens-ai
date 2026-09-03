import { useState } from "react";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(
        "http://127.0.0.1:8000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Invalid email or password."
        );
      }

      localStorage.setItem(
        "paylens_token",
        data.access_token
      );

      localStorage.setItem(
        "paylens_user",
        JSON.stringify(data.user)
      );

      if (onLogin) {
        onLogin(data);
      }

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">

          <div className="auth-logo">
            P
          </div>

          <h1>
            PayLens AI
          </h1>

          <p>
            Payment Intelligence Platform
          </p>

          <h2>
            Welcome Back
          </h2>

          <span>
            Login to access your payment dashboard
          </span>

        </div>

        <form onSubmit={handleLogin}>

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={loading}
              autoComplete="email"
            />

          </div>

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
              autoComplete="current-password"
            />

          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            className="auth-link"
            onClick={onRegister}
            disabled={loading}
          >
            Create Account
          </button>

        </div>

      </div>
    </div>
  );
}

export default Login;