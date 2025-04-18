import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import PerformanceChart from '../../components/PerformanceChart';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';


const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // Récupérer toutes les soumissions
        const subRes = await API.get('/submissions/');
        // Récupérer toutes les corrections
        const corrRes = await API.get('/corrections/');

        // Filtrer uniquement celles de l'étudiant connecté
        const mySubs = subRes.data.filter(sub => sub.student === user.id);
        const myCorr = corrRes.data.filter(c => 
          mySubs.some(sub => sub.id === (c.submission?.id || c.submission))
        );

        // DEBUG
        console.log('mySubs:', mySubs);
        console.log('corrRes.data:', corrRes.data);
        console.log('myCorr:', myCorr);

        setSubmissions(mySubs);
        setCorrections(myCorr);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger vos données.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <p className="p-4">Chargement…</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

// transformer submissions+corrections en séries chronologiques
const chartData = submissions
  .map(sub => {
    const corr = corrections.find(c => c.submission === sub.id);
    return {
      date: new Date(sub.submitted_at).toLocaleDateString(),
      grade: corr?.grade ?? 0
    };
  })
  .sort((a, b) => new Date(a.date) - new Date(b.date));


  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Mon Tableau de Bord</h1>
      {submissions.length === 0 ? (
        <p>Aucune soumission pour l’instant.</p>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Évolution de vos notes</h2>
          <PerformanceChart data={chartData} />
          <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Exercice</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Note</th>
              <th className="px-4 py-2 border">Feedback</th>
              <th className="px-4 py-2 border">Fichier PDF</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => {
              const corr = corrections.find(c => (c.submission?.id || c.submission) === sub.id);
              // console.log('sub:', sub, 'corr:', corr);
              return (
                <tr key={sub.id}>
                  <td className="px-4 py-2 border">{sub.exercise}</td>
                  <td className="px-4 py-2 border">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border">
                    {corr ? `${corr.grade}/20` : 'En attente'}
                  </td>
                  <td className="px-4 py-2 border whitespace-pre-wrap">
                    {corr ? (
                      <>
                        <div className="max-h-16 overflow-hidden text-sm mb-2">
                          <ReactMarkdown>{(corr.feedback?.substring(0, 150) || '') + '...'}</ReactMarkdown>
                        </div>
                        <Link 
                          to={`/student/feedback/${corr.id}`}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded inline-block"
                        >
                          Voir plus
                        </Link>
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2 border">
                    <a
                      href={sub.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Télécharger
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </>
      )}
      </div>
  );
};

export default StudentDashboard;
