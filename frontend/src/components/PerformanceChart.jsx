import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PerformanceChart = ({ data }) => {
  // DEBUG: afficher les données envoyées au graphique
  // eslint-disable-next-line no-console
  console.log('[PerformanceChart] Données envoyées au graphique:', data);
  return (
    <>
      <div className="w-full h-64">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 20]} />
            <Tooltip />
            <Line type="monotone" dataKey="grade" stroke="#8884d8" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </>
  );
};

export default PerformanceChart;
