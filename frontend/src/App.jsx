import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import LoginPage from "./LoginPage";
import "./App.css";

const AUTH_STORAGE_KEY = "waste-ai-auth-v1";

const readAuth = () => {
  try {
    const localAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (localAuth) return JSON.parse(localAuth);

    const sessionAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionAuth) return JSON.parse(sessionAuth);
  } catch {
    // ignore storage read errors
  }
  return null;
};

function App() {
  const [auth, setAuth] = useState(readAuth);

  const clearAuthStorage = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore storage cleanup errors
    }
  };

  const handleLoginSuccess = (payload) => {
    setAuth(payload);
  };

  const handleLogout = () => {
    clearAuthStorage();
    setAuth(null);
  };

  useEffect(() => {
    if (!auth) return;

    try {
      const payload = JSON.stringify(auth);
      if (localStorage.getItem(AUTH_STORAGE_KEY)) {
        localStorage.setItem(AUTH_STORAGE_KEY, payload);
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, payload);
      }
    } catch {
      // ignore storage write errors
    }
  }, [auth]);

  return (
    <div className="app-shell">
      <main className="app-content">
        {!auth?.loggedIn ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Dashboard onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}

export default App;
