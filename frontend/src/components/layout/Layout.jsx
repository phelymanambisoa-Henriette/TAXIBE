import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
