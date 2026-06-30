import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LatencyChart({ data }) {
  const mockData = [
    { name: 'Lượt 1', RAG: 2100, FINETUNE: 800 },
    { name: 'Lượt 2', RAG: 1800, FINETUNE: 750 },
    { name: 'Lượt 3', RAG: 2400, FINETUNE: 900 },
    { name: 'Lượt 4', RAG: 1950, FINETUNE: 820 },
  ];

  // Check an toàn: có data thật và mảng không rỗng thì xài, không thì xài mock
  const chartData = data && data.length > 0 ? data : mockData;

  return (
    <div className="bg-white p-4 shadow rounded mb-6">
      <h3 className="text-lg font-bold mb-4">Latency: RAG vs Fine-tuning</h3>
      <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="RAG" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="FINETUNE" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}