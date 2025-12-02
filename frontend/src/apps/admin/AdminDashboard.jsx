// src/apps/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { interactionService } from '../../services/interactionService';
import { transportService } from '../../services/transportService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaClipboardCheck,
  FaClock,
  FaTimesCircle,
  FaCommentDots,
  FaBus,
  FaChartLine,
  FaUsers,
} from 'react-icons/fa';

import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

import './AdminDashboard.css';

const StatCard = ({ icon, title, value, color, subtitle }) => (
  <div className="kpi-card">
    <div className="kpi-icon" style={{ backgroundColor: `${color}20`, color }}>
      {icon}
    </div>
    <div className="kpi-info">
      <span className="kpi-value" style={{ color }}>{value}</span>
      <span className="kpi-title">{title}</span>
      {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const deny =
    !!user &&
    user.is_staff === false &&
    user.is_superuser !== true &&
    user.is_staf !== true &&
    user.isSuperuser !== true;

  const [contribs, setContribs] = useState([]);
  const [comments, setComments] = useState([]);
  const [busesCount, setBusesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Séries pour graphiques
  const [userSeries, setUserSeries] = useState([]);     // Utilisateurs actifs / jour
  const [searchSeries, setSearchSeries] = useState([]); // Recherches / jour
  const [roleDist, setRoleDist] = useState([]);         // Répartition rôles

  const stats = useMemo(() => {
    const status = (c) => (c.status || c.statut || '').toLowerCase();
    return {
      pending: contribs.filter(c => status(c) === 'pending' || status(c) === 'en_attente').length,
      approved: contribs.filter(c => status(c) === 'approved' || status(c) === 'validee').length,
      rejected: contribs.filter(c => status(c) === 'rejected' || status(c) === 'rejetee').length,
      comments: comments.length,
      buses: busesCount,
    };
  }, [contribs, comments, busesCount]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        // Données actuelles
        const [contribData, commentData, busesRes] = await Promise.all([
          interactionService.getContributions().catch(() => []),
          interactionService.getComments().catch(() => []),
          transportService.getAllBuses().catch(() => ({ data: [] })),
        ]);
        setContribs(Array.isArray(contribData) ? contribData : []);
        setComments(Array.isArray(commentData) ? commentData : []);
        setBusesCount((busesRes.data || []).length);

        // Analytics (avec fallback si endpoints manquants)
        await loadAnalytics();
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const loadAnalytics = async () => {
    // 1) Répartition des rôles
    try {
      const users = await userService.list({});
      const arr = Array.isArray(users) ? users : [];
      const counts = {
        admin: 0, staff: 0, moderator: 0, manager: 0, user: 0, superadmin: 0, other: 0,
      };
      arr.forEach(u => {
        const r = (u.role || (u.is_superuser ? 'superadmin' : u.is_staff ? 'staff' : 'user')).toString().toLowerCase();
        if (counts[r] !== undefined) counts[r] += 1;
        else counts.other += 1;
      });
      const roleData = Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));
      setRoleDist(roleData);
    } catch {
      setRoleDist([
        { name: 'admin', value: 3 },
        { name: 'staff', value: 5 },
        { name: 'user', value: 25 },
      ]);
    }

    // 2) Séries utilisateurs actifs / jour (fallback si pas d’endpoint)
    try {
      // Exemple si tu crées un endpoint userService.activeSeries()
      // const active = await userService.activeSeries(); // [{date:'2025-02-01', value:12}, ...]
      // setUserSeries(active);
      setUserSeries(generateSeries(14, 10, 8)); // fallback
    } catch {
      setUserSeries(generateSeries(14, 10, 8));
    }

    // 3) Séries recherches / jour (fallback)
    try {
      // const hist = await interactionService.historySeries(); // [{date:'2025-02-01', value:22}, ...]
      // setSearchSeries(hist);
      setSearchSeries(generateSeries(14, 20, 10));
    } catch {
      setSearchSeries(generateSeries(14, 20, 10));
    }
  };

  // Générateur de séries fallback (n derniers jours)
  const generateSeries = (days = 14, base = 10, spread = 5) => {
    const out = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const dd = `${d.getDate()}`.padStart(2, '0');
      const value = Math.max(0, Math.round(base + (Math.random() - 0.5) * spread * 2));
      out.push({ date: `${dd}/${m}`, value });
    }
    return out;
  };

  if (deny) {
    return (
      <div className="admin-denied">
        <h2>⛔ Accès Refusé</h2>
        <p>Cette section est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de l'activité TaxiBe</p>
      </div>

      {loading ? (
        <div className="dashboard-loading">Chargement des données...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <StatCard icon={<FaClock />} title="En attente" value={stats.pending} color="#f59e0b" subtitle="Contributions à modérer" />
            <StatCard icon={<FaClipboardCheck />} title="Validées" value={stats.approved} color="#10b981" subtitle="Contributions acceptées" />
            <StatCard icon={<FaTimesCircle />} title="Rejetées" value={stats.rejected} color="#ef4444" subtitle="Contributions refusées" />
            <StatCard icon={<FaCommentDots />} title="Avis" value={stats.comments} color="#8b5cf6" subtitle="Commentaires utilisateurs" />
            <StatCard icon={<FaBus />} title="Flotte" value={stats.buses} color="#3b82f6" subtitle="Bus enregistrés" />
          </div>

          {/* Graphiques */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">
                <FaUsers /> Utilisateurs actifs (14 derniers jours)
              </div>
              <div className="chart-inner">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={userSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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

            <div className="chart-card">
              <div className="chart-title">
                <FaChartLine /> Recherches (14 derniers jours)
              </div>
              <div className="chart-inner">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={searchSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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

            <div className="chart-card">
              <div className="chart-title">
                <FaUsers /> Répartition des rôles
              </div>
              <div className="chart-inner">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={roleDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                      {roleDist.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#00D2A0', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#94a3b8'][index % 7]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section détails (si tu veux garder) */}
          <div className="dashboard-details-grid">
            <div className="detail-card">
              <h3>💬 Derniers Commentaires</h3>
              {comments.slice(0, 5).length > 0 ? (
                <ul className="recent-list">
                  {comments.slice(0, 5).map((c) => (
                    <li key={c.id} className="recent-item">
                      <span className="recent-user">{c.username || c.user?.username || 'Anonyme'}</span>
                      <span className="recent-text">"{(c.contenu || c.text || '').slice(0, 60)}"</span>
                      <span className="recent-date">{new Date(c.date_creation || c.created_at || Date.now()).toLocaleDateString('fr-FR')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-text">Aucun commentaire récent.</p>
              )}
            </div>

            <div className="detail-card">
              <h3>⚡ Actions Rapides</h3>
              <div className="quick-actions">
                <button className="btn-quick">Ajouter un Bus</button>
                <button className="btn-quick">Voir Signalements</button>
                <button className="btn-quick warning">Purger Cache</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;