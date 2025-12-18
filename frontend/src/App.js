// src/App.js - VERSION CORRIGÉE

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layouts
import Layout from './components/layout/Layout'; 
import AdminLayout from './components/layout/AdminLayout'; 

// Protections
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';

// Pages CLIENT
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Search from './pages/Search';
import Transport from './apps/transport/Transport';
import BusDetail from './pages/BusDetail'; 
import NearbyBuses from './pages/NearbyBuses'; 
import Carte from './pages/Carte';
import NotFound from './pages/NotFound'; 
import HelpSupport from './pages/HelpSupport';
import Settings from './pages/Settings'; 

// Auth & Profil
import Login from './apps/utilisateur/Login';
import Register from './apps/utilisateur/Register';
import Profil from './apps/utilisateur/Profil';

// Interaction
import Commentaires from './apps/interaction/Commentaires';
import Contribution from './apps/interaction/Contribution';

// Pages ADMIN
import AdminDashboard from './apps/admin/AdminDashboard';
import AdminBusList from './apps/admin/AdminBusList';      
import AdminBusForm from './apps/admin/AdminBusForm';      
import AdminCommentaires from './apps/admin/AdminCommentaires';
import AdminContributions from './apps/admin/AdminContributions';
import AdminHistorique from './apps/admin/AdminHistorique';
import AdminReports from './apps/admin/AdminReports';
import AdminUsers from './apps/admin/AdminUsers';

import 'leaflet/dist/leaflet.css';
import './leafletConfig';

import ProfileHistory from './pages/ProfileHistory';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <Routes>

            {/* ✅ WELCOME EN PREMIER SUR "/" */}
            <Route path="/" element={<Welcome />} />
            <Route path="/welcome" element={<Welcome />} />

            {/* ========== LOGIN SANS LAYOUT ========== */}
            <Route path="/login" element={<Login />} />
            
            {/* ========== ZONE CLIENT/PUBLIQUE (avec Layout) ========== */}
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/bus/:id" element={<BusDetail />} />
              <Route path="/nearby" element={<NearbyBuses />} />
              <Route path="/commentaires" element={<Commentaires />} />
              
              {/* Carte */}
              <Route path="/carte" element={<Carte />} />
              <Route path="/map" element={<Carte />} />
              
              <Route path="/help" element={<HelpSupport />} /> 
              <Route path="/settings" element={<Settings />} /> 
              
              {/* Pages Auth - version avec layout (si besoin) */}
              <Route path="/register" element={<Register />} />

              {/* Pages Nécessitant Connexion */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profil" element={<Profil />} />
                <Route path="/contribution" element={<Contribution />} />
                <Route path="/profil/historique" element={<ProfileHistory />} />
              </Route>
            </Route>

            {/* ========== ZONE ADMIN (Protégée) ========== */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="bus" element={<AdminBusList />} />
              <Route path="bus/new" element={<AdminBusForm />} />
              <Route path="bus/:id" element={<AdminBusForm />} />
              <Route path="commentaires" element={<AdminCommentaires />} />
              <Route path="contributions" element={<AdminContributions />} />
              <Route path="signalements" element={<AdminReports />} />
              <Route path="utilisateurs" element={<AdminUsers />} />
              <Route path="historiques" element={<AdminHistorique />} />
            </Route>

            {/* ========== 404 ========== */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider> 
  );
}

export default App;