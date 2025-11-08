import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulation d’un login backend
    login({ email: form.email, token: 'fake-jwt-token' });
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', paddingTop: 40 }}>
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} required />
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  );
};

export default Login;
