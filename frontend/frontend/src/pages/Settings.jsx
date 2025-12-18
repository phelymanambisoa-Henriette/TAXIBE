// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaUserCog, FaPalette, FaTrash, FaSync, FaSignOutAlt, 
  FaSun, FaMoon, FaBell, FaLock, FaLanguage, FaShieldAlt,
  FaEye, FaEyeSlash, FaSave, FaCheck
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, language, toggleTheme, changeLanguage, isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // États
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  
  // Préférences
  const [preferences, setPreferences] = useState({
    notifications: { email: true, push: true, sms: false },
    privacy: { showProfile: true, showLocation: false }
  });

  // Mot de passe
  const [passwordData, setPasswordData] = useState({
    current: '', new: '', confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false
  });
  const [passwordError, setPasswordError] = useState('');

  // Message de sauvegarde
  const showSavedMessage = (msg) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  // Changer la langue
  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
    showSavedMessage(t('messages.languageChanged'));
  };

  // Toggle thème
  const handleThemeToggle = () => {
    toggleTheme();
    showSavedMessage(t('messages.themeChanged'));
  };

  // Notifications
  const handleNotificationChange = (type) => {
    setPreferences(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: !prev.notifications[type] }
    }));
  };

  // Confidentialité
  const handlePrivacyChange = (type) => {
    setPreferences(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [type]: !prev.privacy[type] }
    }));
  };

  // Sauvegarder
  const savePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    showSavedMessage(t('messages.preferencesSaved'));
  };

  // Mot de passe
  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (passwordData.new.length < 8) {
      setPasswordError(t('messages.passwordMinLength'));
      return;
    }
    
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError(t('messages.passwordMismatch'));
      return;
    }

    try {
      // TODO: Appel API
      showSavedMessage(t('messages.passwordChanged'));
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      setPasswordError(t('common.error'));
    }
  };

  // Cache
  const clearLocalCacheSafe = () => {
    if (!window.confirm(t('messages.confirmClearCache'))) return;

    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const userJSON = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme');
    const savedLang = localStorage.getItem('language');
    
    localStorage.clear();
    sessionStorage.clear();
    
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    if (userJSON) localStorage.setItem('user', userJSON);
    if (savedTheme) localStorage.setItem('theme', savedTheme);
    if (savedLang) localStorage.setItem('language', savedLang);
    
    showSavedMessage(t('messages.cacheCleared'));
  };

  // Suppression compte
  const handleDeleteAccount = async () => {
    const deleteWord = language === 'en' ? 'DELETE' : language === 'mg' ? 'HAMAFA' : 'SUPPRIMER';
    const confirmation = window.prompt(t('messages.confirmDelete'));
    
    if (confirmation !== deleteWord) {
      alert(t('messages.deleteCancelled'));
      return;
    }

    setIsDeleting(true);
    try {
      logout(false);
      navigate('/register');
    } catch (error) {
      alert(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Charger préférences
  useEffect(() => {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  return (
    <div className="settings-page">
      <div className="settings-container">
        
        {/* Notification */}
        {savedMessage && (
          <div className="save-notification">
            <FaCheck /> {savedMessage}
          </div>
        )}

        {/* Header */}
        <div className="settings-header">
          <h1><FaUserCog /> {t('settings.title')}</h1>
          <p>{t('settings.welcome')}, <strong>{user?.username || 'Utilisateur'}</strong></p>
        </div>

        <div className="settings-grid">
          
          {/* 🌙 THÈME */}
          <div className="settings-card">
            <h2><FaPalette /> {t('settings.appearance')}</h2>
            
            <div className="setting-item-row">
              <span className="setting-label">
                {t('settings.theme')} : 
                <strong className={`theme-status ${theme}`}>
                  {isDark ? `🌙 ${t('settings.dark')}` : `☀️ ${t('settings.light')}`}
                </strong>
              </span>
              <button onClick={handleThemeToggle} className="btn-action primary">
                {isDark ? <FaSun /> : <FaMoon />} {t('settings.toggle')}
              </button>
            </div>
          </div>

          {/* 🌍 LANGUE */}
          <div className="settings-card">
            <h2><FaLanguage /> {t('settings.language')}</h2>
            
            <div className="setting-item-row">
              <span className="setting-label">{t('settings.selectLanguage')}</span>
              <select 
                value={language} 
                onChange={handleLanguageChange}
                className="setting-select"
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="mg">🇲🇬 Malagasy</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>
          
          {/* 🔔 NOTIFICATIONS */}
          <div className="settings-card">
            <h2><FaBell /> {t('settings.notifications')}</h2>
            
            <div className="setting-item-row">
              <span className="setting-label">{t('settings.email')}</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item-row">
              <span className="setting-label">{t('settings.push')}</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications.push}
                  onChange={() => handleNotificationChange('push')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item-row">
              <span className="setting-label">{t('settings.sms')}</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications.sms}
                  onChange={() => handleNotificationChange('sms')}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* 🔒 CONFIDENTIALITÉ */}
          <div className="settings-card">
            <h2><FaShieldAlt /> {t('settings.privacy')}</h2>
            
            <div className="setting-item-row">
              <span className="setting-label">{t('settings.publicProfile')}</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.privacy.showProfile}
                  onChange={() => handlePrivacyChange('showProfile')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item-row">
              <span className="setting-label">{t('settings.shareLocation')}</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.privacy.showLocation}
                  onChange={() => handlePrivacyChange('showLocation')}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* 🔑 SÉCURITÉ */}
          <div className="settings-card">
            <h2><FaLock /> {t('settings.security')}</h2>
            
            {passwordError && <div className="error-message">{passwordError}</div>}
            
            <div className="password-field">
              <label>{t('settings.currentPassword')}</label>
              <div className="input-with-icon">
                <input 
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                >
                  {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="password-field">
              <label>{t('settings.newPassword')}</label>
              <div className="input-with-icon">
                <input 
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  placeholder={t('settings.minChars')}
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="password-field">
              <label>{t('settings.confirmPassword')}</label>
              <div className="input-with-icon">
                <input 
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  placeholder={t('settings.confirmPassword')}
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button onClick={handlePasswordChange} className="btn-action primary full-width">
              <FaLock /> {t('settings.changePassword')}
            </button>
          </div>
          
          {/* 🗑️ CACHE */}
          <div className="settings-card">
            <h2><FaSync /> {t('settings.localData')}</h2>
            
            <div className="setting-item-row">
              <span className="setting-label">{t('settings.clearCache')}</span>
              <button onClick={clearLocalCacheSafe} className="btn-action secondary">
                <FaSync /> {t('settings.clear')}
              </button>
            </div>
          </div>

          {/* ⚠️ DANGER */}
          <div className="settings-card danger-zone">
            <h2><FaTrash /> {t('settings.dangerZone')}</h2>
            
            <div className="setting-item-row">
              <span className="setting-label">{t('settings.deleteAccount')}</span>
              <button 
                onClick={handleDeleteAccount} 
                className="btn-action danger"
                disabled={isDeleting}
              >
                {isDeleting ? t('common.loading') : t('settings.delete')}
              </button>
            </div>
            <p className="danger-warning">⚠️ {t('settings.irreversible')}</p>
          </div>
          
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button onClick={savePreferences} className="btn-save">
            <FaSave /> {t('settings.savePreferences')}
          </button>
          <button onClick={() => logout()} className="btn-logout-full">
            <FaSignOutAlt /> {t('settings.fullLogout')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;