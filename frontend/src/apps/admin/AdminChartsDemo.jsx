// src/apps/admin/AdminChartsDemo.jsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import './AdminChartsDemo.css';

// Données de démo
const lineData = [
  { date: '01/02', value: 12 },
  { date: '02/02', value: 18 },
  { date: '03/02', value: 9 },
  { date: '04/02', value: 15 },
  { date: '05/02', value: 14 },
  { date: '06/02', value: 21 },
  { date: '07/02', value: 17 },
];

const barData = [
  { date: '01/02', value: 22 },
  { date: '02/02', value: 16 },
  { date: '03/02', value: 19 },
  { date: '04/02', value: 28 },
  { date: '05/02', value: 24 },
  { date: '06/02', value: 20 },
  { date: '07/02', value: 26 },
];

const pieData = [
  { name: 'admin', value: 3 },
  { name: 'staff', value: 5 },
  { name: 'user', value: 25 },
  { name: 'other', value: 2 },
];

const pieColors = ['#00D2A0', '#3b82f6', '#f59e0b', '#8b5cf6'];

const AdminChartsDemo = () => {
  return (
    <div className="charts-demo-page">
      <h1>Démo Graphiques Recharts</h1>
      <p>Si vous voyez ces 3 graphiques, Recharts est bien installé et fonctionne.</p>

      <div className="charts-grid">
        {/* Ligne: Utilisateurs actifs */}
        <div className="chart-card">
          <div className="chart-title">Utilisateurs actifs (7j)</div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="Actifs" stroke="#00D2A0" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barres: Recherches */}
        <div className="chart-card">
          <div className="chart-title">Recherches (7j)</div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Recherches" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camembert: Rôles */}
        <div className="chart-card">
          <div className="chart-title">Répartition des rôles</div>
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChartsDemo;