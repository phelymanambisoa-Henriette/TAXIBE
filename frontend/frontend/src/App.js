// src/App.js (TOUT ENTIER)

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Contexts
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { ItineraireProvider } from './contexts/ItineraireContext';
import { ThemeProvider } from './contexts/ThemeContext'; // ← AJOUT

import Layout from './components/layout/Layout'; 
import AdminLayout from './components/layout/AdminLayout'; 

// Protections
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';

// Pages CLIENT
import Home from './pages/Home';
import Search from './pages/Search';
import Transport from './apps/transport/Transport';
import BusDetail from './pages/BusDetail'; 
import NearbyBuses from './pages/NearbyBuses'; 
import CartePage from './components/Carte/CarteInteractive'; 
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


function App() {
  return (
    <ThemeProvider> {/* ← AJOUT : Enveloppe tout */}
      <AuthProvider>
        <LocationProvider>
          <ItineraireProvider>
            <Routes>
              
              {/* --- ZONE CLIENT/PUBLIQUE (Layout général) --- */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/transport" element={<Transport />} />
                <Route path="/bus/:id" element={<BusDetail />} />
                <Route path="/carte" element={<CartePage />} />
                <Route path="/nearby" element={<NearbyBuses />} />
                <Route path="/commentaires" element={<Commentaires />} />
                
                <Route path="/help" element={<HelpSupport />} /> 
                <Route path="/settings" element={<Settings />} /> 
                
                {/* Pages Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Pages Nécessitant Connexion */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/contribution" element={<Contribution />} />
                </Route>
              </Route>

              {/* --- ZONE ADMIN (Protégée) --- */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
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

              {/* 404 */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </ItineraireProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider> 
  );
}

export default App;