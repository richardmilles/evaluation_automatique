import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import ReactMarkdown from 'react-markdown';

const FeedbackDetail = () => {
  const { correctionId } = useParams();
  const [correction, setCorrection] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Récupérer la correction
        const corrRes = await API.get('/corrections/');
        const corrData = corrRes.data.find(c => c.id === parseInt(correctionId));
        
        if (!corrData) {
          setError('Correction non trouvée');
          return;
        }
        
        setCorrection(corrData);
        
        // Récupérer la soumission associée
        const subRes = await API.get('/submissions/');
        const subData = subRes.data.find(s => s.id === corrData.submission);
        setSubmission(subData);
        
        // Récupérer l'exercice associé
        if (subData) {
          const exRes = await API.get('/exercises/');
          const exData = exRes.data.find(e => e.id === subData.exercise);
          setExercise(exData);
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [correctionId]);

  if (loading) return <div className="p-8 text-center">Chargement du feedback...</div>;
  if (error) return <div className="p-8 bg-red-100 text-red-800 rounded">{error}</div>;
  if (!correction) return <div className="p-8 bg-yellow-100 text-yellow-800 rounded">Correction non trouvée</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feedback détaillé</h1>
        {submission && (
          <Link 
            to={`/professor/exercise/${submission.exercise}/submissions`}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Retour à la liste
          </Link>
        )}
      </div>

      {/* Informations sur l'exercice */}
      {exercise && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Exercice : {exercise.title}</h2>
          <div className="text-sm">
            <p className="mb-2"><strong>Description :</strong></p>
            <p className="whitespace-pre-line bg-white p-3 rounded border">{exercise.description}</p>
          </div>
        </div>
      )}

      {/* Informations sur l'étudiant */}
      {submission && submission.student && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Soumission</h2>
          <p><strong>Étudiant :</strong> {submission.student.first_name} {submission.student.last_name}</p>
          <p><strong>Date :</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
          <p className="mt-2">
            <a 
              href={submission.pdf_url} 
              target="_blank" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded inline-block"
            >
              Voir le PDF
            </a>
          </p>
        </div>
      )}

      {/* Correction et feedback */}
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Évaluation</h2>
          <span className="text-3xl font-bold bg-white px-3 py-1 rounded-full border-2 border-green-500">
            {correction.grade}/20
          </span>
        </div>
        
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Feedback de l'IA :</h3>
          <div className="prose max-w-none">
            <ReactMarkdown>{correction.feedback}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetail;
