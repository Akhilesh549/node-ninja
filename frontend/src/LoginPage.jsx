import { useEffect, useMemo, useState } from "react";

const AUTH_STORAGE_KEY = "waste-ai-auth-v1";
const REMEMBER_STORAGE_KEY = "waste-ai-remember-v1";
const ACCOUNT_STORAGE_KEY = "waste-ai-account-v1";

const MOCK_USER = {
  identifier: "admin@wasteai.com",
  password: "Waste@123"
};

const readRememberedIdentifier = () => {
  try {
    return localStorage.getItem(REMEMBER_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const readSavedAccount = () => {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState(readRememberedIdentifier());
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(readRememberedIdentifier()));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("success");
  const [popupMessage, setPopupMessage] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState({});

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        id: index,
        left: `${(index * 7) % 100}%`,
        top: `${(index * 11) % 100}%`,
        delay: `${(index % 6) * 0.6}s`,
        size: `${10 + (index % 4) * 4}px`
      })),
    []
  );

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes loginFloat {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(0, -14px, 0); }
      }
      @keyframes loginGlow {
        0%, 100% { opacity: .45; transform: scale(1); }
        50% { opacity: .75; transform: scale(1.06); }
      }
      @keyframes loginFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes loginSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes toastIn {
        0% { transform: translateY(18px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!showPopup) return undefined;
    const timer = window.setTimeout(() => setShowPopup(false), 2200);
    return () => window.clearTimeout(timer);
  }, [showPopup]);

  const validate = () => {
    const errors = {};
    if (!identifier.trim()) {
      errors.identifier = "Username or email is required.";
    } else if (identifier.includes("@")) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(identifier.trim())) {
        errors.identifier = "Enter a valid email address.";
      }
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setPopupType("error");
      setPopupMessage("Please fix the highlighted fields.");
      setShowPopup(true);
      return;
    }

    setIsLoading(true);
    setToast("Checking credentials...");

    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const savedAccount = readSavedAccount();
    const isValid =
      (savedAccount &&
        normalizedIdentifier === String(savedAccount.identifier || "").toLowerCase() &&
        normalizedPassword === String(savedAccount.password || "")) ||
      (normalizedIdentifier === MOCK_USER.identifier &&
        normalizedPassword === MOCK_USER.password);

    if (isValid) {
      const authPayload = {
        loggedIn: true,
        identifier: identifier.trim(),
        loginTime: new Date().toISOString()
      };

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_STORAGE_KEY, identifier.trim());
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload));
        } else {
          localStorage.removeItem(REMEMBER_STORAGE_KEY);
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload));
        }
      } catch {
        // ignore storage errors
      }

      setPopupType("success");
      setPopupMessage("Welcome back! Ready to save the planet 🌍");
      setShowPopup(true);
      setToast("Login successful.");
      window.setTimeout(() => onLoginSuccess?.(authPayload), 900);
      return;
    }

    setPopupType("error");
    setPopupMessage("Invalid credentials. Try admin@wasteai.com / Waste@123");
    setShowPopup(true);
    setToast("Login failed.");
    setIsLoading(false);
  };

  const handleForgotPassword = (event) => {
    event.preventDefault();
    setToast("Forgot password flow will be connected later.");
  };

  const handleSignupOpen = (event) => {
    event.preventDefault();
    setSignupErrors({});
    setShowSignupModal(true);
  };

  const handleSignupSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    const trimmedName = signupName.trim();
    const trimmedEmail = signupEmail.trim().toLowerCase();
    const trimmedPassword = signupPassword.trim();
    const trimmedConfirm = signupConfirmPassword.trim();

    if (!trimmedName) {
      nextErrors.name = "Name is required.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmedEmail)) {
        nextErrors.email = "Enter a valid email address.";
      }
    }

    if (trimmedPassword.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (trimmedPassword !== trimmedConfirm) {
      nextErrors.confirm = "Passwords do not match.";
    }

    setSignupErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setPopupType("error");
      setPopupMessage("Please fix the signup fields.");
      setShowPopup(true);
      return;
    }

    try {
      localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify({
        name: trimmedName,
        identifier: trimmedEmail,
        password: trimmedPassword
      }));
    } catch {
      // ignore storage errors
    }

    setIdentifier(trimmedEmail);
    setPassword(trimmedPassword);
    setShowSignupModal(false);
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setSignupErrors({});
    setPopupType("success");
    setPopupMessage("Account created. You can log in now.");
    setShowPopup(true);
    setToast("Signup successful.");
  };

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      background: "radial-gradient(circle at top left, rgba(46, 204, 113, 0.18), transparent 22%), radial-gradient(circle at top right, rgba(45, 156, 219, 0.2), transparent 24%), linear-gradient(135deg, #05111d 0%, #0c1a2e 45%, #132743 100%)",
      color: "#edf4fb",
      display: "grid",
      placeItems: "center",
      padding: "24px"
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
        opacity: 0.2,
        pointerEvents: "none"
      }} />

      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: "absolute",
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.16)",
            boxShadow: "0 0 18px rgba(46, 204, 113, 0.35)",
            animation: `loginFloat 7s ease-in-out ${particle.delay} infinite, loginGlow 5s ease-in-out ${particle.delay} infinite`
          }}
        />
      ))}

      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "1120px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "24px",
        alignItems: "center",
        zIndex: 1
      }}>
        <section style={{
          padding: "20px",
          animation: "loginFadeUp 0.7s ease both"
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(14px)"
          }}>
            <span style={{ fontSize: "18px" }}>♻️</span>
            <span style={{ fontSize: "13px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Waste Segregation AI
            </span>
          </div>

          <h1 style={{
            margin: "18px 0 10px",
            fontSize: "clamp(40px, 6vw, 72px)",
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            color: "#f7fbff"
          }}>
            Smart Waste Management for a Greener Future
          </h1>

          <p style={{
            maxWidth: "560px",
            fontSize: "clamp(16px, 2vw, 20px)",
            lineHeight: 1.7,
            color: "rgba(237,244,251,0.82)",
            marginBottom: "24px"
          }}>
            Log in to analyze waste, get confidence feedback, hear voice guidance, and keep your eco streak growing.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "14px",
            maxWidth: "560px"
          }}>
            {[
              ["Fast scan", "Capture or upload"],
              ["Smart guidance", "Voice-assisted results"],
              ["Eco rewards", "Points and badges"]
            ].map(([title, subtitle]) => (
              <div
                key={title}
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)"
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "6px" }}>{title}</div>
                <div style={{ color: "rgba(237,244,251,0.72)", fontSize: "14px" }}>{subtitle}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{
          position: "relative",
          padding: "14px",
          animation: "loginFadeUp 0.8s ease both"
        }}>
          <div style={{
            position: "absolute",
            inset: "18px",
            borderRadius: "32px",
            background: "linear-gradient(145deg, rgba(46, 204, 113, 0.26), rgba(45, 156, 219, 0.12))",
            filter: "blur(24px)",
            opacity: 0.8
          }} />

          <form
            onSubmit={handleSubmit}
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "28px",
              borderRadius: "28px",
              background: "rgba(8, 18, 31, 0.78)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)"
            }}
          >
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(46, 204, 113, 0.95), rgba(45, 156, 219, 0.95), transparent)",
              animation: "loginSpin 7s linear infinite"
            }} />

            <div style={{ marginBottom: "22px" }}>
              <div style={{
                fontSize: "14px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(237,244,251,0.66)"
              }}>
                Welcome back
              </div>
              <h2 style={{
                margin: "10px 0 6px",
                fontSize: "30px",
                color: "#ffffff"
              }}>
                Login to continue
              </h2>
              <p style={{ color: "rgba(237,244,251,0.72)" }}>
                Access the dashboard, review scans, and keep your waste sorting flow going.
              </p>
            </div>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>Username or Email</span>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or email"
                autoComplete="username"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: fieldErrors.identifier ? "1px solid #ff8080" : "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.96)",
                  color: "#102033",
                  outline: "none",
                  transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(46, 204, 113, 0.16)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {fieldErrors.identifier && (
                <div style={{ color: "#ffb3b3", fontSize: "13px", marginTop: "6px" }}>{fieldErrors.identifier}</div>
              )}
            </label>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>Password</span>
              <div style={{ position: "relative" }}>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit(e);
                    }
                  }}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    padding: "14px 54px 14px 16px",
                    borderRadius: "16px",
                    border: fieldErrors.password ? "1px solid #ff8080" : "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.96)",
                    color: "#102033",
                    outline: "none",
                    transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "10px",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#102033"
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {fieldErrors.password && (
                <div style={{ color: "#ffb3b3", fontSize: "13px", marginTop: "6px" }}>{fieldErrors.password}</div>
              )}
            </label>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "18px"
            }}>
              <label style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "rgba(237,244,251,0.84)",
                fontSize: "14px"
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>

              <a
                href="#forgot-password"
                onClick={handleForgotPassword}
                style={{
                  color: "#7dd3fc",
                  textDecoration: "none",
                  fontSize: "14px"
                }}
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "14px 18px",
                border: "none",
                borderRadius: "16px",
                cursor: isLoading ? "not-allowed" : "pointer",
                background: isLoading
                  ? "linear-gradient(135deg, #6b7280, #94a3b8)"
                  : "linear-gradient(135deg, #27ae60, #2ecc71)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "16px",
                boxShadow: "0 18px 36px rgba(39, 174, 96, 0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "transform 180ms ease, filter 180ms ease"
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff",
                    animation: "loginSpin 0.8s linear infinite"
                  }} />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>

            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "6px",
              marginTop: "18px",
              color: "rgba(237,244,251,0.8)",
              fontSize: "14px"
            }}>
              <span>New here?</span>
              <a href="#signup" onClick={handleSignupOpen} style={{ color: "#7dd3fc", textDecoration: "none", fontWeight: 700 }}>
                Sign Up / Register
              </a>
            </div>

            <div style={{
              marginTop: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(237,244,251,0.76)",
              fontSize: "14px",
              lineHeight: 1.6
            }}>
              Demo login:
              <div style={{ marginTop: "6px", color: "#fff", fontWeight: 700 }}>admin@wasteai.com / Waste@123</div>
            </div>
          </form>
        </section>
      </div>

      {toast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 3000,
          padding: "14px 18px",
          borderRadius: "16px",
          background: "rgba(8, 18, 31, 0.94)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.3)",
          animation: "toastIn 0.3s ease"
        }}>
          {toast}
        </div>
      )}

      {showPopup && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 4000,
          background: "rgba(2, 8, 19, 0.64)",
          display: "grid",
          placeItems: "center",
          padding: "24px"
        }}>
          <div style={{
            width: "min(420px, 100%)",
            padding: "28px",
            borderRadius: "24px",
            background: "rgba(8, 18, 31, 0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            textAlign: "center",
            boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
            animation: "loginFadeUp 0.35s ease"
          }}>
            <div style={{ fontSize: "54px", marginBottom: "10px" }}>
              {popupType === "success" ? "🎉" : "⚠️"}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>
              {popupType === "success" ? "Success" : "Login Error"}
            </div>
            <div style={{ color: "rgba(237,244,251,0.78)", marginTop: "10px", lineHeight: 1.6 }}>
              {popupMessage}
            </div>
          </div>
        </div>
      )}

      {showSignupModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 5000,
          background: "rgba(2, 8, 19, 0.72)",
          display: "grid",
          placeItems: "center",
          padding: "24px"
        }}>
          <form
            onSubmit={handleSignupSubmit}
            style={{
              width: "min(460px, 100%)",
              padding: "28px",
              borderRadius: "24px",
              background: "rgba(8, 18, 31, 0.98)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              boxShadow: "0 30px 70px rgba(0,0,0,0.45)"
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: 800 }}>Create account</div>
            <div style={{ color: "rgba(237,244,251,0.74)", marginTop: "6px" }}>
              Register a new account for this frontend demo.
            </div>

            <label style={{ display: "block", marginTop: "16px" }}>
              <span style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>Name</span>
              <input
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: "14px",
                  border: signupErrors.name ? "1px solid #ff8080" : "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.96)",
                  color: "#102033"
                }}
              />
              {signupErrors.name && <div style={{ color: "#ffb3b3", fontSize: "13px", marginTop: "6px" }}>{signupErrors.name}</div>}
            </label>

            <label style={{ display: "block", marginTop: "14px" }}>
              <span style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>Email</span>
              <input
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: "14px",
                  border: signupErrors.email ? "1px solid #ff8080" : "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.96)",
                  color: "#102033"
                }}
              />
              {signupErrors.email && <div style={{ color: "#ffb3b3", fontSize: "13px", marginTop: "6px" }}>{signupErrors.email}</div>}
            </label>

            <label style={{ display: "block", marginTop: "14px" }}>
              <span style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>Password</span>
              <input
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                type="password"
                placeholder="Create password"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: "14px",
                  border: signupErrors.password ? "1px solid #ff8080" : "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.96)",
                  color: "#102033"
                }}
              />
              {signupErrors.password && <div style={{ color: "#ffb3b3", fontSize: "13px", marginTop: "6px" }}>{signupErrors.password}</div>}
            </label>

            <label style={{ display: "block", marginTop: "14px" }}>
              <span style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>Confirm Password</span>
              <input
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: "14px",
                  border: signupErrors.confirm ? "1px solid #ff8080" : "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.96)",
                  color: "#102033"
                }}
              />
              {signupErrors.confirm && <div style={{ color: "#ffb3b3", fontSize: "13px", marginTop: "6px" }}>{signupErrors.confirm}</div>}
            </label>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setShowSignupModal(false)}
                style={{
                  flex: 1,
                  padding: "13px 14px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontWeight: 800
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: "13px 14px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                  color: "#fff",
                  fontWeight: 800
                }}
              >
                Register
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
