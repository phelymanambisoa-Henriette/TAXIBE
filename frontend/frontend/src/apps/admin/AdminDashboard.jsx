// src/apps/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaPlus,
  FaExclamationTriangle,
  FaArrowRight,
  FaMapMarkerAlt,
  FaSync
} from 'react-icons/fa';

import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area
} from 'recharts';

import './AdminDashboard.css';

const COLORS = ['#00D2A0', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

const StatCard = ({ icon, title, value, color, subtitle, trend, onClick }) => (
  <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="kpi-icon" style={{ backgroundColor: `${color}15`, color }}>
      {icon}
    </div>
    <div className="kpi-info">
      <span className="kpi-value" style={{ color }}>{value}</span>
      <span className="kpi-title">{title}</span>
      {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
      {trend && (
        <span className={`kpi-trend ${trend > 0 ? 'up' : 'down'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const hasAccess = user && (
    user.is_staff === true || 
    user.is_superuser === true ||
    user.role === 'admin'
  );

  const [contribs, setContribs] = useState([]);
  const [comments, setComments] = useState([]);
  const [buses, setBuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Séries pour graphiques
  const [userSeries, setUserSeries] = useState([]);
  const [searchSeries, setSearchSeries] = useState([]);
  const [roleDist, setRoleDist] = useState([]);

  const stats = useMemo(() => {
    const status = (c) => (c.status || c.statut || '').toLowerCase();
    return {
      pending: contribs.filter(c => status(c) === 'pending' || status(c) === 'en_attente').length,
      approved: contribs.filter(c => status(c) === 'approved' || status(c) === 'validee').length,
      rejected: contribs.filter(c => status(c) === 'rejected' || status(c) === 'rejetee').length,
      comments: comments.length,
      buses: buses.length,
      busesActifs: buses.filter(b => (b.status || '').toLowerCase() === 'actif').length,
      users: users.length,
      usersActifs: users.filter(u => u.is_active !== false).length,
    };
  }, [contribs, comments, buses, users]);

  useEffect(() => {
    if (hasAccess) {
      loadAll();
    }
  }, [hasAccess]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [contribData, commentData, busesRes, usersData] = await Promise.all([
        interactionService.getContributions().catch(() => []),
        interactionService.getComments().catch(() => []),
        transportService.getAllBuses().catch(() => ({ data: [] })),
        userService.list({}).catch(() => []),
      ]);
      
      setContribs(Array.isArray(contribData) ? contribData : []);
      setComments(Array.isArray(commentData) ? commentData : []);
      setBuses(busesRes.data?.results || busesRes.data || []);
      setUsers(Array.isArray(usersData) ? usersData : []);

      await loadAnalytics(usersData);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (usersData) => {
    // Répartition des rôles
    const arr = Array.isArray(usersData) ? usersData : [];
    const counts = { admin: 0, staff: 0, moderator: 0, user: 0 };
    
    arr.forEach(u => {
      const r = (u.role || 'user').toLowerCase();
      if (counts[r] !== undefined) counts[r] += 1;
      else counts.user += 1;
    });
    
    const roleData = Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    setRoleDist(roleData);

    // Séries (fallback avec données générées)
    setUserSeries(generateSeries(14, 15, 8));
    setSearchSeries(generateSeries(14, 25, 12));
  };

  const generateSeries = (days = 14, base = 10, spread = 5) => {
    const out = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dd = `${d.getDate()}`.padStart(2, '0');
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const value = Math.max(0, Math.round(base + (Math.random() - 0.5) * spread * 2));
      out.push({ date: `${dd}/${m}`, value });
    }
    return out;
  };

  if (!hasAccess) {
    return (
      <div className="admin-denied">
        <FaExclamationTriangle />
        <h2>Accès Refusé</h2>
        <p>Cette section est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Tableau de bord</h1>
          <p>Bienvenue, {user?.username || 'Admin'} ! Vue d'ensemble de TaxiBe.</p>
        </div>
        <button className="btn-refresh" onClick={loadAll} disabled={loading}>
          <FaSync className={loading ? 'spin' : ''} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Chargement des données...</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <StatCard 
              icon={<FaClock />} 
              title="En attente" 
              value={stats.pending} 
              color="#f59e0b" 
              subtitle="Contributions à modérer"
              onClick={() => navigate('/admin/contributions')}
            />
            <StatCard 
              icon={<FaClipboardCheck />} 
              title="Validées" 
              value={stats.approved} 
              color="#10b981" 
              subtitle="Contributions acceptées" 
            />
            <StatCard 
              icon={<FaTimesCircle />} 
              title="Rejetées" 
              value={stats.rejected} 
              color="#ef4444" 
              subtitle="Contributions refusées" 
            />
            <StatCard 
              icon={<FaCommentDots />} 
              title="Commentaires" 
              value={stats.comments} 
              color="#8b5cf6" 
              subtitle="Avis utilisateurs"
              onClick={() => navigate('/admin/commentaires')}
            />
            <StatCard 
              icon={<FaBus />} 
              title="Bus" 
              value={`${stats.busesActifs}/${stats.buses}`} 
              color="#3b82f6" 
              subtitle="Actifs / Total"
              onClick={() => navigate('/admin/bus')}
            />
            <StatCard 
              icon={<FaUsers />} 
              title="Utilisateurs" 
              value={stats.users} 
              color="#00D2A0" 
              subtitle={`${stats.usersActifs} actifs`}
              onClick={() => navigate('/admin/utilisateurs')}
            />
          </div>

          {/* Graphiques */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">
                <FaUsers /> Utilisateurs actifs (14 jours)
              </div>
              <div className="chart-inner">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={userSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D2A0" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00D2A0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      name="Actifs" 
                      stroke="#00D2A0" 
                      fill="url(#colorUsers)"
                      strokeWidth={3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">
                <FaChartLine /> Recherches (14 jours)
              </div>
              <div className="chart-inner">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={searchSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
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
                    <Pie 
                      data={roleDist} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={50} 
                      outerRadius={90} 
                      paddingAngle={4}
                      label
                    >
                      {roleDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Actions rapides + Derniers commentaires */}
          <div className="dashboard-details-grid">
            <div className="detail-card">
              <h3>⚡ Actions Rapides</h3>
              <div className="quick-actions">
                <button className="btn-quick" onClick={() => navigate('/admin/bus/new')}>
                  <FaPlus /> Ajouter un Bus
                </button>
                <button className="btn-quick" onClick={() => navigate('/admin/contributions')}>
                  <FaClipboardCheck /> Modérer Contributions
                </button>
                <button className="btn-quick" onClick={() => navigate('/admin/signalements')}>
                  <FaExclamationTriangle /> Voir Signalements
                </button>
                <button className="btn-quick" onClick={() => navigate('/admin/utilisateurs')}>
                  <FaUsers /> Gérer Utilisateurs
                </button>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <h3>💬 Derniers Commentaires</h3>
                <button className="btn-link" onClick={() => navigate('/admin/commentaires')}>
                  Voir tout <FaArrowRight />
                </button>
              </div>
              {comments.slice(0, 5).length > 0 ? (
                <ul className="recent-list">
                  {comments.slice(0, 5).map((c) => (
                    <li key={c.id} className="recent-item">
                      <div className="recent-avatar">
                        {(c.username || c.user?.username || 'A')[0].toUpperCase()}
                      </div>
                      <div className="recent-content">
                        <span className="recent-user">{c.username || c.user?.username || 'Anonyme'}</span>
                        <span className="recent-text">"{(c.contenu || c.text || '').slice(0, 50)}..."</span>
                      </div>
                      <span className="recent-date">
                        {new Date(c.date_creation || c.created_at || Date.now()).toLocaleDateString('fr-FR')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-text">Aucun commentaire récent.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;