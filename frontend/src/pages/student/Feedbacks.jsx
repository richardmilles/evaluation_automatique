import { useEffect, useState, useContext } from 'react';
import API from '../../api/axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import StudentMenu from '../../components/StudentMenu';

const Feedbacks = () => {
  const { user } = useContext(AuthContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Récupérer toutes les corrections de l'étudiant connecté
    API.get('/corrections/')
      .then(res => {
        const myFeedbacks = res.data.filter(c => c.submission && (c.submission.student === user.id || c.submission === user.id));
        setFeedbacks(myFeedbacks);
      })
      .catch(() => setFeedbacks([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <>
      <StudentMenu />
      <div className="p-8 pt-24">
        <h1 className="text-2xl font-bold mb-6">Mes feedbacks</h1>
        {feedbacks.length === 0 ? (
          <div className="bg-yellow-100 p-4 rounded text-yellow-800">
            Aucun feedback disponible pour l'instant.
          </div>
        ) : (
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border text-black">Exercice</th>
                <th className="px-4 py-2 border text-black">Note</th>
                <th className="px-4 py-2 border text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(fb => (
                <tr key={fb.id}>
                  <td className="px-4 py-2 border text-black">{fb.submission?.exercise || '-'}</td>
                  <td className="px-4 py-2 border text-black">{fb.grade}/20</td>
                  <td className="px-4 py-2 border text-black">
                    <Link
                      to={`/student/feedback/${fb.id}`}
                      className="text-blue-500 underline"
                    >
                      Voir détail
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

export default Feedbacks;
