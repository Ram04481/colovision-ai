import { BrainCircuit, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const links = [["Home", "/"], ["About Us", "/about"], ["Facilities", "/facilities"], ["Contact", "/contact"]];
export function SiteLayout() {
  const [open, setOpen] = useState(false);
  return <div className="site-shell">
    <header className="nav"><Link className="brand" to="/"><BrainCircuit /> <span>ColoVision <b>AI</b></span></Link>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      <nav className={open ? "nav-links open" : "nav-links"}>{links.map(([name, path]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}>{name}</NavLink>)}<Link className="login-link" to="/login">Login</Link><Link className="button small" to="/register">Register</Link></nav>
    </header><main><Outlet /></main><footer>© 2026 ColoVision AI · Research and decision-support platform. Not a medical diagnosis.</footer>
  </div>;
}
