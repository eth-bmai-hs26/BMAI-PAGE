import { Link, NavLink } from 'react-router-dom';
import { EthLogo } from './EthLogo';

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <EthLogo className="brand__eth" />
          <span className="brand__divider" />
          <span className="brand__course">Building Machine Learning and AI Applications</span>
        </Link>
        <nav className="site-nav">
          <NavLink to="/" end className="site-nav__link">
            Overview
          </NavLink>
          <NavLink to="/calendar" className="site-nav__link">
            Calendar
          </NavLink>
          <NavLink to="/office-hours" className="site-nav__link">
            Office hours
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
