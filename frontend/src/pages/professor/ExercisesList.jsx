import { useEffect, useState, useContext } from 'react';
import API from '../../api/axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ProfessorMenu from '../../components/ProfessorMenu';

const ExercisesList = () => {
  const { user } = useContext(AuthContext);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    API.get('/exercises/')
      .then(res => {
        setExercises(res.data.filter(ex => ex.professor && String(ex.professor.id) === String(user.id)));
      })
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <>
      <ProfessorMenu />
      <div className="p-8 pt-24">
      <h1 className="text-2xl font-bold mb-6">Mes exercices</h1>
      {exercises.length === 0 ? (
        <div className="bg-yellow-100 p-4 rounded text-yellow-800">
          Aucun exercice créé pour l'instant.
        </div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border text-black">Titre</th>
              <th className="px-4 py-2 border text-black">Date</th>
              <th className="px-4 py-2 border text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map(ex => (
              <tr key={ex.id}>
                <td className="px-4 py-2 border text-black">{ex.title}</td>
                <td className="px-4 py-2 border text-black">{new Date(ex.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2 border text-black">
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
      )}
    </div>
    </>
  );
};

export default ExercisesList;
