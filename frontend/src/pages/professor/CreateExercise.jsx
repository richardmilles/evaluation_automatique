// src/pages/professor/CreateExercise.jsx
import { useState } from 'react';
import API from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import ProfessorMenu from '../../components/ProfessorMenu';

const CreateExercise = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    model_answer: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/exercises/', form);
      navigate('/professor/dashboard');
    } catch (err) {
      console.error(err);
      setError('Échec de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProfessorMenu />
      <div className="max-w-lg mx-auto p-8 pt-24">
      <h1 className="text-2xl font-bold mb-6">Créer un exercice</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Titre</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Réponse Modèle</label>
          <textarea
            name="model_answer"
            value={form.model_answer}
            onChange={handleChange}
            rows="4"
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn w-full"
        >
          {loading ? 'Création en cours…' : 'Créer'}
        </button>
      </form>
    </div>
    </>
  );
};

export default CreateExercise;
