
import { useState, type FormEvent } from "react";
import "./Login.css";

type LoginProps = {
  onLogin: () => void;
};

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    // Temporary demo login only.
    // Replace with Spring Boot authentication before production.
    if (
      email.trim().toLowerCase() === "admin" &&
      password === "Admin@123"
    ) {
      onLogin();
    } else {
      setError("Invalid Username or password.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="visual-brand">
          <div className="login-logo">W</div>
          <span>WaterFlow</span>
        </div>

        <div className="visual-content">
          <span className="visual-tag">WATER MANAGEMENT SYSTEM</span>
          <h1>Managing water.<br />Building a better future.</h1>
          <p>
            A smarter way to manage customers, water connections,
            meter readings and billing in one place.
          </p>

          <div className="visual-stats">
            <div>
              <strong>Smart</strong>
              <span>Customer management</span>
            </div>
            <div>
              <strong>Simple</strong>
              <span>Billing & collections</span>
            </div>
          </div>
        </div>

        <div className="visual-footer">
          WaterFlow · Water Management Platform
        </div>
      </section>

      <section className="login-form-side">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="mobile-logo">
            <div className="login-logo">W</div>
            <strong>WaterFlow</strong>
          </div>

          <div className="login-heading">
            <span className="welcome-label">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access the admin dashboard.</p>
          </div>


            <label htmlFor="username">Username</label>
            <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
            />


          <div className="password-label-row">
            <label htmlFor="password">Password</label>
          </div>
          <div className="password-input-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              className="show-password"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <button className="sign-in-button" type="submit">
            Sign In <span>→</span>
          </button>

          <div className="secure-note">
            <span>▣</span>
            Secure access for authorized administrators
          </div>

          <div className="login-bottom">
            © {new Date().getFullYear()} WaterFlow
          </div>
        </form>
      </section>
    </main>
  );
}

export default Login;
