// src/components/layout/ClientLayoutRoute.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './Layout';

/**
 * Ce wrapper permet d'utiliser ton Layout client existant
 * comme "layout de route" avec Outlet.
 */
const ClientLayoutRoute = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ClientLayoutRoute;
