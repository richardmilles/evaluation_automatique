import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import ProfessorMenu from '../../components/ProfessorMenu';

const SubmissionList = () => {
  const { exerciseId } = useParams();            // on passera /professor/exercise/:exerciseId/submissions
  const [subs, setSubs] = useState([]);
  const [corrs, setCorrs] = useState([]);
  const [plagChecks, setPlagChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(null); // ID de la soumission en cours d'évaluation
  const [message, setMessage] = useState(null); // Message de confirmation

  // Gestion du chargement de plagiat
  const [detectingPlagiarism, setDetectingPlagiarism] = useState(false);

  // --- Fonction de chargement globale, accessible partout ---
  const fetchAll = async () => {
      setLoading(true);
      try {
        // Récupérer les soumissions, corrections, utilisateurs ET plagiat
        const [subRes, corrRes, usersRes, plagRes] = await Promise.all([
          API.get('/submissions/'),
          API.get('/corrections/'),
          API.get('/users/'),
          API.get('/plagiarism/')
        ]);

        // Debug: log API responses
        console.log('subRes.data:', subRes.data);
        console.log('corrRes.data:', corrRes.data);
        console.log('usersRes.data:', usersRes.data);
        console.log('plagRes.data:', plagRes.data);
        
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
        setPlagChecks(plagRes.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
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

  // DEBUG : Affiche les checks reçus du backend
  console.log('plagChecks:', plagChecks);
  // Map submissionId → score max de plagiat
  const plagMap = {};
  plagChecks.forEach(pc => {
    const id1 = Number(pc.submission_1?.id);
    const id2 = Number(pc.submission_2?.id);
    if (id1) {
      plagMap[id1] = Math.max(pc.similarity_score, plagMap[id1] || 0);
    }
    if (id2) {
      plagMap[id2] = Math.max(pc.similarity_score, plagMap[id2] || 0);
    }
  });
  // DEBUG : Affiche le map utilisé pour le rendu
  console.log('plagMap:', plagMap);

  if (loading) return <div className="p-8 text-center">Chargement des soumissions...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <ProfessorMenu />
      <div className="p-8 pt-24">
        <h1 className="text-2xl font-bold mb-6">Soumissions Exercice #{exerciseId}</h1>
        {/* Bouton Détecter Plagiat */}
        <button
          className={`mb-6 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded ${detectingPlagiarism ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={detectingPlagiarism}
          onClick={async () => {
            setDetectingPlagiarism(true);
            setMessage(null);
            try {
              // Appel unique à la nouvelle route backend
              await API.post(`/detect_plagiarism/${exerciseId}/`);
              // Recharger les données de plagiat
              const plagRes = await API.get('/plagiarism/');
              setPlagChecks(plagRes.data);
              setMessage({ type: 'success', text: 'Détection de plagiat terminée !' });
            } catch (err) {
              setMessage({ type: 'error', text: 'Erreur lors de la détection de plagiat.' });
              console.error(err);
            } finally {
              setDetectingPlagiarism(false);
            }
          }}
        >
          {detectingPlagiarism ? 'Détection en cours...' : 'Détecter Plagiat'}
        </button>
      
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
              <th className="px-4 py-2 border text-black">Étudiant</th>
              <th className="px-4 py-2 border text-black">Date de soumission</th>
              <th className="px-4 py-2 border text-black">Note</th>
              <th className="px-4 py-2 border text-black">Plagiat (%)<br/><span className="text-xs font-normal">(par soumission)</span></th>
              <th className="px-4 py-2 border text-black">Feedback</th>
              <th className="px-4 py-2 border text-black">Document</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => {
              const corr = corrs.find(c => c.submission && c.submission.id === s.id);
              return (
                <tr key={s.id}>
                  <td className="px-4 py-2 border text-black">
                    {s.student?.first_name} {s.student?.last_name}
                  </td>
                  <td className="px-4 py-2 border text-black">{new Date(s.submitted_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 border text-black">
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
                  <td className={`px-4 py-2 border ${plagMap[Number(s.id)] > 80 ? 'text-red-600' : ''}`}>
  {plagMap[Number(s.id)] !== undefined ? `${Math.round(plagMap[Number(s.id)])}%` : '0%'}
  <br/>
  <button
    className="mt-1 bg-purple-500 hover:bg-purple-700 text-white px-2 py-1 text-xs rounded"
    onClick={async () => {
      setDetectingPlagiarism(true);
      setMessage(null);
      try {
        // Récupérer toutes les soumissions de CE même exercice (hors elle-même)
        const allSubsRes = await API.get('/submissions/');
        const exerciseSubs = allSubsRes.data.filter(sub => sub.exercise === s.exercise && sub.id !== s.id);
         // Comparer la soumission à TOUTES les autres de l'exercice
         for (const otherSub of exerciseSubs) {
           await API.post(`/detect_plagiarism/${s.exercise}/`, { submission_1: s.id, submission_2: otherSub.id });
         }
        // Recharge tout (soumissions, corrections, users, checks)
        await fetchAll();
        setMessage({ type: 'success', text: 'Détection de plagiat individuelle effectuée.' });
      } catch (err) {
        setMessage({ type: 'error', text: 'Erreur lors de la détection individuelle.' });
        console.error(err);
      } finally {
        setDetectingPlagiarism(false);
      }
    }}
    disabled={detectingPlagiarism}
  >
    Détecter
  </button>
</td>
                  <td className="px-4 py-2 border text-black">
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
                  <td className="px-4 py-2 border text-black">
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
    </div>
  );
};

export default SubmissionList;
