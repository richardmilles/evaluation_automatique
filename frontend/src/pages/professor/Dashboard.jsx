import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import { Link } from 'react-router-dom';
import ProfessorStatsChart from '../../components/ProfessorStatsChart';

const ProfessorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [exercises, setExercises] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Récupérer toutes les données
        const [exRes, subRes, corrRes] = await Promise.all([
          API.get('/exercises/'),
          API.get('/submissions/'),
          API.get('/corrections/')
        ]);

        // DEBUG : afficher user.id et la liste des exercices reçus
        console.log('user.id:', user.id);
        console.log('exRes.data:', exRes.data);
        // Filtrer les exercices du professeur connecté
        setExercises(
          exRes.data.filter(ex => ex.professor && String(ex.professor.id) === String(user.id))
        );
        setSubmissions(subRes.data);
        setCorrections(corrRes.data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const countSubs = exId =>
    submissions.filter(s => s.exercise === exId).length;

  const countCorr = exId =>
    corrections.filter(c =>
      submissions.some(
        s => s.id === c.submission && s.exercise === exId
      )
    ).length;

  if (loading) return <p className="p-4">Chargement…</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord Professeur</h1>

      <Link to="/professor/create" className="btn mb-4">
        + Créer un exercice
      </Link>

      {exercises.length === 0 ? (
        <p>Aucun exercice créé pour l’instant.</p>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Moyenne par exercice</h2>

          <ProfessorStatsChart
            exercises={exercises}
            submissions={submissions}
            corrections={corrections}
          />

          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Titre</th>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Soumissions</th>
                <th className="px-4 py-2 border">Corrigées</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {exercises.map(ex => (
                <tr key={ex.id}>
                  <td className="px-4 py-2 border">{ex.title}</td>
                  <td className="px-4 py-2 border">
                    {new Date(ex.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border">{countSubs(ex.id)}</td>
                  <td className="px-4 py-2 border">{countCorr(ex.id)}</td>
                  <td className="px-4 py-2 border">
                    <Link
                      to={`/professor/exercise/${ex.id}/submissions`}
                      className="text-blue-500 underline"
                    >
                      Voir soumissions
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ProfessorDashboard;
