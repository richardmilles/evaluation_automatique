// src/pages/student/Submit.jsx
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const Submit = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [exerciseId, setExerciseId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  // 1) Récupérer la liste des exercices si besoin (optionnel)
  // Tu peux ajouter un useEffect + API.get('/exercises/') pour remplir un <select>

  // 2) Gérer la sélection de fichier
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  // 3) Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseId || !file) {
      setError('Veuillez choisir un exercice et un fichier PDF.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('exercise', exerciseId);
      formData.append('pdf', file);

      await API.post('/submissions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Fichier soumis avec succès !');
      setFile(null);
      setExerciseId('');
      navigate('/student/dashboard');
    } catch (err) {
      console.error(err);
      setError('Échec de la soumission. Réessaye.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    API.get('/exercises/')
      .then(res => setExercises(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Soumettre un exercice</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Exercice (ID)</label>
          <select
            value={exerciseId}
            onChange={e => setExerciseId(e.target.value)}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">-- Choisir un exercice --</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>

        </div>
        <div>
          <label className="block mb-1">Fichier PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn w-full"
        >
          {loading ? 'Envoi en cours…' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
};

export default Submit;
