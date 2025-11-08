
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <NavLink to="/localisation">📍 Localisation</NavLink>
      <NavLink to="/transport">🚍 Transport</NavLink>
      <NavLink to="/interaction">💬 Interaction</NavLink>
      <NavLink to="/profil">👤 Profil</NavLink>
    </div>
  );
}

export default Sidebar;


//<NavLink to="/localisation">📍 Localisation</NavLink>
//<NavLink to="/transport">🚍 Transport</NavLink>
//<NavLink to="/interaction">💬 Interaction</NavLink>
//<NavLink to="/profil">👤 Profil</NavLink>
