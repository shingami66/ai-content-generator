import React from "react";
import { useNavigate } from "react-router-dom";
import "../AI.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">✨ Powered by Advanced AI</div>
          <h1 className="hero-title">
            Create <span className="gradient-text">Stunning Visual Content</span> in Seconds
          </h1>
          <p className="hero-subtitle">
            Generate professional images and videos with just a few words.
          </p>
          <button className="cta-button" onClick={() => navigate("/register")}>
            Generate for free
          </button>
          <p className="hero-note">No credit card required • Free trial available</p>
        </div>

        <div className="hero-visual">
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
              justifyContent: "center",
              height: "100%",
              paddingTop: "1rem",
            }}
          >
            <div
              style={{
                width: 300,
                borderRadius: "0.75rem",
                overflow: "hidden",
                background: "var(--surface-strong)",
                padding: "0.5rem",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <img
                src="https://www.piclumen.com/wp-content/uploads/2024/10/piclumen-upscale-after.webp"
                alt="AI Generated"
                style={{
                  width: "100%",
                  display: "block",
                  borderRadius: "0.5rem",
                }}
              />
            </div>
            <div
              style={{
                width: 300,
                borderRadius: "0.75rem",
                overflow: "hidden",
                background: "var(--surface-strong)",
                padding: "0.5rem",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <img
                src="https://www.esparklearning.com/app/uploads/2024/04/Albert-Einstein-generated-by-AI-1024x683.webp"
                alt="AI Video"
                style={{
                  width: "100%",
                  display: "block",
                  borderRadius: "0.5rem",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Why Choose AI Create Studio?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Generate high-quality content in seconds with our optimized AI models</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Creative Freedom</h3>
            <p>Unlimited styles and customization options for your unique vision</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Your creations are safe with enterprise-grade security</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💎</div>
            <h3>Premium Quality</h3>
            <p>Professional-grade output ready for commercial use</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Create Something Amazing?</h2>
          <p>Join thousands of creators using AI to bring their ideas to life</p>
          <button className="cta-button-large" onClick={() => navigate("/register")}>
            Generate for free
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
