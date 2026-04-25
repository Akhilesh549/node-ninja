import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="site-header">
      <NavLink className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">
          W
        </span>
        <span>Waste Segregation AI</span>
      </NavLink>

      <nav className="nav-links" aria-label="Primary navigation">
        <NavLink to="/">Scanner</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
