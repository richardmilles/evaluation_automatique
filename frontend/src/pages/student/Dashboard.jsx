import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import PerformanceChart from '../../components/PerformanceChart';
import StudentMenu from '../../components/StudentMenu';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';


const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [submissions, setSubmissions] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    // Récupère les infos détaillées de l'étudiant connecté
    API.get(`/users/${user.id}/`)
      .then(res => setStudentInfo(res.data))
      .catch(() => setStudentInfo(null));
    console.log('user object:', user);
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
    <>
      <StudentMenu />
      <div className="p-8 pt-24">
      <h1 className="text-3xl font-bold mb-2">Mon Tableau de Bord</h1>
      {studentInfo && (
        <div className="mb-6 text-lg text-gray-700">
          Étudiant : <span className="font-semibold">{studentInfo.first_name} {studentInfo.last_name}</span>
        </div>
      )}
      {submissions.length === 0 ? (
        <p>Aucune soumission pour l’instant.</p>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Évolution de vos notes</h2>
          <PerformanceChart data={chartData} />
          <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100 text-black">
              <th className="px-4 py-2 border text-black">Exercice</th>
              <th className="px-4 py-2 border text-black">Date</th>
              <th className="px-4 py-2 border text-black">Note</th>
              <th className="px-4 py-2 border text-black">Feedback</th>
              <th className="px-4 py-2 border text-black">Fichier PDF</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => {
              const corr = corrections.find(c => (c.submission?.id || c.submission) === sub.id);
              // console.log('sub:', sub, 'corr:', corr);
              return (
                <tr key={sub.id}>
                  <td className="px-4 py-2 border text-black">{sub.exercise}</td>
                  <td className="px-4 py-2 border text-black">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border text-black">
                    {corr ? `${corr.grade}/20` : 'En attente'}
                  </td>
                  <td className="px-4 py-2 border whitespace-pre-wrap text-black">
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
                  <td className="px-4 py-2 border text-black">
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
    </>
  );
};

export default StudentDashboard;
