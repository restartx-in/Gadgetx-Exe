import { useState } from "react";
import useLogin from "@/apps/user/hooks/api/auth/useLogin";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isLoading, error } = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) {
      navigate("/");
    }
  };

  const IMG_URL = "src/assets/login-bg.png";

  return (
    <div className="login-page" style={{ backgroundImage: `url(${IMG_URL})` }}>
      <div className="login-page__overlay">
        <div className="login-page__container">
          {/* Welcome Block */}
          <section className="login-page__welcome">
            <div className="login-page__brand">OptiVision</div>
            <h1 className="login-page__welcome-title">
              Welcome <br /> Back
            </h1>
            <p className="login-page__welcome-text">
              Precision management and clarity for every frame. Access your
              professional enterprise suite.
            </p>
          </section>

          {/* Form Block */}
          <section className="login-page__form-section">
            <div className="login-page__form-box">
              <h2 className="login-page__form-title">Sign in</h2>

              <form onSubmit={handleSubmit} className="login-page__form">
                {error && <div className="login-page__error-msg">{error}</div>}

                <div className="login-page__input-group">
                  <label className="login-page__label">Username</label>
                  <input
                    className="login-page__input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="login-page__input-group">
                  <label className="login-page__label">Password</label>
                  <input
                    className="login-page__input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="login-page__options">
                  <label className="login-page__remember">
                    <input
                      className="login-page__checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="login-page__remember-text">
                      Remember Me
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="login-page__submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in now"}
                </button>

                <div className="login-page__footer-links">
                  <button type="button" className="login-page__link-btn">
                    Lost your password?
                  </button>
                </div>
              </form>

              <div className="login-page__legal">
                By clicking on "Sign in now" you agree to <br />
                <a href="#" className="login-page__legal-link">
                  Terms of Service
                </a>{" "}
                |{" "}
                <a href="#" className="login-page__legal-link">
                  Privacy Policy
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
