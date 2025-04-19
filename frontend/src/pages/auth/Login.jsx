import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Tentative de connexion avec:', form);
    try {
      await login(form.username, form.password);   // ▶︎ appel AuthContext
      console.log('Connexion réussie, redirection...');
      navigate('/post-login');                  // redirection gérée étape 7
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
      {error && <p className="text-red-500 mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          className="input w-full"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          className="input w-full"
          onChange={handleChange}
          required
        />
        <button className="btn w-full">Se connecter</button>
      </form>
    </div>
  );
};
export default Login;
