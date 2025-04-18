import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const ProfessorStatsChart = ({ exercises, submissions, corrections }) => {
  // calculer moyenne par exercice
  const data = exercises.map(ex => {
    const subs = submissions.filter(s => s.exercise === ex.id);
    const grades = corrections
      .filter(c => subs.some(s => s.id === c.submission))
      .map(c => c.grade);
    const avg = grades.length
      ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)
      : 0;
    return { title: ex.title, average: parseFloat(avg) };
  });

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="title" />
          <YAxis domain={[0, 20]} />
          <Tooltip />
          <Bar dataKey="average" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfessorStatsChart;
