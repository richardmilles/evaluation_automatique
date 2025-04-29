import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const ProfessorStatsChart = ({ exercises, submissions, corrections }) => {
  // DEBUG: afficher les données calculées
  // eslint-disable-next-line no-console
  const data = exercises.map(ex => {
    const subs = submissions.filter(s => s.exercise === ex.id);
    const grades = corrections
      .filter(c => subs.some(s => s.id === (c.submission?.id || c.submission)))
      .map(c => parseFloat(c.grade)) // Conversion string en number
      .filter(g => !isNaN(g)); // Vérification que c'est bien un nombre valide
    const avg = grades.length
      ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)
      : 0;
    
    // Création des initiales pour le titre
    const initials = ex.title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
      
    return { 
      title: ex.title,       // Titre complet pour l'infobulle
      initials: initials,   // Initiales pour l'affichage
      average: parseFloat(avg) 
    };
  });
  console.log('[ProfessorStatsChart] Données envoyées au graphique:', data);

  return (
    <>

      <div className="w-full h-64">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="initials" 
              tick={{ fontSize: 14 }}
            />
            <YAxis domain={[0, 20]} />
            <Tooltip 
              formatter={(value) => [`${value}/20`, 'Note moyenne']} 
              labelFormatter={(initials, item) => {
                // Cas 1: item est un tableau avec payload.title
                if (Array.isArray(item) && item[0] && item[0].payload && item[0].payload.title) {
                  return item[0].payload.title;
                }
                // Cas 2: item est un objet avec payload.title
                if (item && typeof item === 'object' && item.payload && item.payload.title) {
                  return item.payload.title;
                }
                // Cas fallback: retourne les initiales
                return initials;
              }}
            />
            <Bar dataKey="average" fill="#82ca9d" name="Moyenne" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default ProfessorStatsChart;
