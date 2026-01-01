import React from "react";
import "../AI.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section brand">
          <h2>⚡ AI Creator Studio</h2>
          <p>Advanced platform for creating visual content using cutting-edge artificial intelligence technology</p>
        </div>
        <div className="footer-section">
          <h3>Products</h3>
          <ul>
            <li>Image Generator</li>
            <li>Video Generator</li>
            <li>Text Editor</li>
            <li>Developer API</li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Company</h3>
          <ul>
            <li>About Us</li>
            <li>Pricing</li>
            <li>Blog</li>
            <li>Careers</li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Support</h3>
          <ul>
            <li>Help Center</li>
            <li>Contact Us</li>
            <li>Terms & Conditions</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 AI Creator Studio. All rights reserved.</p>
        <div className="social-icons">
          <span style={{ fontSize: '1.5rem' }}>📘 📷 🐦 💼</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
