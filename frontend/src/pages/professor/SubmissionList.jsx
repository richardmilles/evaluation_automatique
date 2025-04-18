import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const SubmissionList = () => {
  const { exerciseId } = useParams();            // on passera /professor/exercise/:exerciseId/submissions
  const [subs, setSubs] = useState([]);
  const [corrs, setCorrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(null); // ID de la soumission en cours d'évaluation
  const [message, setMessage] = useState(null); // Message de confirmation

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Récupérer les soumissions, corrections et utilisateurs
        const [subRes, corrRes, usersRes] = await Promise.all([
          API.get('/submissions/'),
          API.get('/corrections/'),
          API.get('/users/')
        ]);

        // Debug: log API responses
        console.log('subRes.data:', subRes.data);
        console.log('corrRes.data:', corrRes.data);
        console.log('usersRes.data:', usersRes.data);
        
        // Filtrer les soumissions pour cet exercice
        const filtered = subRes.data.filter(s => s.exercise === parseInt(exerciseId));
        
        // Associer chaque soumission à l'utilisateur correspondant
        const enrichedSubs = filtered.map(sub => {
          const studentUser = usersRes.data.find(u => u.id === sub.student);
          return { ...sub, student: studentUser };
        });
        
        // Debug: log enriched submissions
        console.log('enrichedSubs:', enrichedSubs);
        setSubs(enrichedSubs);
        setCorrs(corrRes.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [exerciseId]);

  const handleEvaluate = async (submissionId) => {
    try {
      setEvaluating(submissionId);
      setMessage(null);
      await API.post(`/evaluation/${submissionId}/`);
      // recharger
      const corrRes = await API.get('/corrections/');
      setCorrs(corrRes.data);
      setMessage({ type: 'success', text: 'Évaluation terminée avec succès !' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'évaluation.' });
    } finally {
      setEvaluating(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement des soumissions...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Soumissions Exercice #{exerciseId}</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {subs.length === 0 ? (
        <div className="bg-yellow-100 p-4 rounded text-yellow-800">
          Aucune soumission pour cet exercice.
        </div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Étudiant</th>
              <th className="px-4 py-2 border">Date de soumission</th>
              <th className="px-4 py-2 border">Note</th>
              <th className="px-4 py-2 border">Feedback</th>
              <th className="px-4 py-2 border">Document</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => {
              const corr = corrs.find(c => c.submission && c.submission.id === s.id);
              return (
                <tr key={s.id}>
                  <td className="px-4 py-2 border">
                    {/* Version simplifiée pour afficher le nom et prénom */}
                    {s.student?.first_name} {s.student?.last_name}
                  </td>
                  <td className="px-4 py-2 border">{new Date(s.submitted_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 border">
                    {corr ? (
                      <span className="font-bold">{corr.grade}/20</span>
                    ) : evaluating === s.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
                        Évaluation...
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEvaluate(s.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Évaluer
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 border">
                    {corr ? (
                      <div>
                        <div className="max-h-16 overflow-hidden text-sm mb-2">
                          <ReactMarkdown>{corr.feedback.substring(0, 150) + '...'}</ReactMarkdown>
                        </div>
                        <Link 
                          to={`/professor/feedback/${corr.id}`}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded inline-block"
                        >
                          Voir plus
                        </Link>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2 border">
                    <a 
                      href={s.pdf_url} 
                      target="_blank" 
                      className="text-blue-500 hover:underline"
                    >
                      Voir PDF
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SubmissionList;
