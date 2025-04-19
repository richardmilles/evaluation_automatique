import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const menuItems = [
  { path: '/professor/dashboard', label: 'Tableau de bord' },
  { path: '/professor/create', label: 'Créer un exercice' },
  { path: '/professor/exercises', label: 'Mes exercices' },
  { path: '/professor/exercises', label: 'Toutes les soumissions' }, // Redirige aussi vers la liste des exercices
  // Ajoute ici d'autres actions possibles pour le professeur
];

export default function ProfessorMenu() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  if (!user || user.role !== 'professor') return null;

  return (
    <nav className="bg-blue-600 text-white px-4 py-3 shadow flex items-center gap-6 fixed top-0 left-0 w-full z-50">
      <div className="font-bold text-lg">Espace Professeur</div>
      {menuItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`hover:underline px-2 py-1 rounded text-white transition-colors duration-150 ${location.pathname.startsWith(item.path) ? 'bg-blue-800' : ''} hover:text-black hover:bg-white`}
        >
          {item.label}
        </Link>
      ))}
      <div className="flex-1"></div>
      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-white transition-colors duration-150 hover:text-black hover:bg-white"
      >
        Déconnexion
      </button>
    </nav>
  );
}
