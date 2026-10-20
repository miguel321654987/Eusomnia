// src/frontend/pages/Home.jsx
import { Link } from "react-router-dom";

/**
 * Home – Landing page of the application.
 * Shows a hero section, a brief description and a call‑to‑action button.
 */
export const Home = () => {
  return (
    <main className="home-page text-white">
      {/* Hero section */}
      <section className="hero">
        <h1 className="hero__title">Welcome to MyApp</h1>
        <p className="hero__subtitle">
          An intuitive platform that helps you manage your tasks efficiently.
        </p>
        {/* CTA button that leads to the main feature area */}
        <Link to="/dashboard" className="hero__cta btn-primary">
          Get Started
        </Link>
      </section>

      {/* Features preview */}
      <section className="features">
        <h2 className="features__title">Key Features</h2>
        <ul className="features__list">
          <li>
            <strong>Real‑time Collaboration</strong> – Work with your team in
            sync.
          </li>
          <li>
            <strong>Smart Notifications</strong> – Stay informed without
            distractions.
          </li>
          <li>
            <strong>Analytics Dashboard</strong> – Visualize your progress.
          </li>
        </ul>
      </section>

      {/* Footer call‑to‑action */}
      <section className="footer-cta">
        <p>Ready to improve your workflow?</p>
        <Link to="/signup" className="btn-secondary">
          Sign Up Free
        </Link>
      </section>
    </main>
  );
};
