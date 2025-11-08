import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import BusDetail from './pages/BusDetail';
import Contribution from './apps/interaction/Contribution';
import Commentaires from './apps/interaction/Commentaires';
import Localisation from './apps/localisation/Localisation';
import Transport from './apps/transport/Transport';
import Interaction from './apps/interaction/Interaction';
import Login from './apps/utilisateur/Login';
import Register from './apps/utilisateur/Register';
import Profil from './apps/utilisateur/Profil';



function App() {
  return (
    <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bus/:id" element={<BusDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contribution" element={<Contribution />} />
          <Route path="/commentaires" element={<Commentaires />} />
          <Route path="/localisation" element={<Localisation />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/interaction" element={<Interaction />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profil" element={<Profil />} />

          
        </Routes>
      </Layout>
  );
}

export default App;
