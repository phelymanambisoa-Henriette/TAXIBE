// src/utils/translations.js

export const translations = {
  fr: {
    // Navigation / Header
    'nav.home': 'Accueil',
    'nav.search': 'Recherche',
    'nav.preferences': 'Préférences',
    'nav.language': 'Langue',
    'nav.notifications': 'Notifications',
    'nav.noNotifications': 'Aucune notification',
    'nav.markAllRead': 'Tout marquer lu',
    'nav.help': 'Aide & Support',
    'nav.theme': 'Changer thème',
    'nav.resetWelcome': 'Revoir intro',
    'nav.clearCache': 'Effacer cache',
    'nav.profile': 'Mon profil',
    'nav.logout': 'Déconnexion',

    // Commentaires
    'comments.title': 'Commentaires',
    'comments.noComments': 'Aucun commentaire pour le moment',
    'comments.beFirst': 'Soyez le premier à donner votre avis !',
    'comments.leaveComment': 'Laisser un avis',
    'comments.yourComment': 'Votre commentaire',
    'comments.yourCommentPlaceholder': 'Partagez votre expérience avec ce bus...',
    'comments.rating': 'Note',
    'comments.publish': 'Publier',
    'comments.publishing': 'Publication...',
    'comments.loginToComment': 'Connectez-vous pour laisser un commentaire',
    'comments.commentAdded': 'Commentaire ajouté avec succès !',
    'comments.errorAdding': 'Erreur lors de l\'ajout du commentaire',

    // Commun
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
  },

  mg: {
    // Navigation / Header
    'nav.home': 'Fandraisana',
    'nav.search': 'Karohy',
    'nav.preferences': 'Safidy',
    'nav.language': 'Fiteny',
    'nav.notifications': 'Fampandrenesana',
    'nav.noNotifications': 'Tsy misy fampandrenesana',
    'nav.markAllRead': 'Ataovy efa voavaky',
    'nav.help': 'Fanampiana & Fanohanana',
    'nav.theme': 'Ovay lohahevitra',
    'nav.resetWelcome': 'Avereno ny torolalana',
    'nav.clearCache': 'Fafao ny cache',
    'nav.profile': 'Mombamomba ahy',
    'nav.logout': 'Hivoaka',

    // Commentaires
    'comments.title': 'Hevitra',
    'comments.noComments': 'Tsy misy hevitra',
    'comments.beFirst': 'Aoka ho voalohany hanome hevitra!',
    'comments.leaveComment': 'Mamela hevitra',
    'comments.yourComment': 'Ny hevitrao',
    'comments.yourCommentPlaceholder': 'Zarao ny traikefanao momba ity fiara ity...',
    'comments.rating': 'Naoty',
    'comments.publish': 'Avoaka',
    'comments.publishing': 'Mamoaka...',
    'comments.loginToComment': 'Midira mba hamela hevitra',
    'comments.commentAdded': 'Hevitra nampiana!',
    'comments.errorAdding': 'Nisy olana nandefa ny hevitra',

    // Commun
    'common.loading': 'Mamorona...',
    'common.error': 'Tsy nety',
  },

  en: {
    // Navigation / Header
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.preferences': 'Preferences',
    'nav.language': 'Language',
    'nav.notifications': 'Notifications',
    'nav.noNotifications': 'No notifications',
    'nav.markAllRead': 'Mark all as read',
    'nav.help': 'Help & Support',
    'nav.theme': 'Change theme',
    'nav.resetWelcome': 'Show intro again',
    'nav.clearCache': 'Clear cache',
    'nav.profile': 'My profile',
    'nav.logout': 'Logout',

    // Commentaires
    'comments.title': 'Comments',
    'comments.noComments': 'No comments yet',
    'comments.beFirst': 'Be the first to comment!',
    'comments.leaveComment': 'Leave a review',
    'comments.yourComment': 'Your comment',
    'comments.yourCommentPlaceholder': 'Share your experience with this bus...',
    'comments.rating': 'Rating',
    'comments.publish': 'Publish',
    'comments.publishing': 'Publishing...',
    'comments.loginToComment': 'Login to leave a comment',
    'comments.commentAdded': 'Comment added successfully!',
    'comments.errorAdding': 'Error while adding comment',

    // Commun
    'common.loading': 'Loading...',
    'common.error': 'Error',
  },
};

export const getCurrentLanguage = () => {
  return localStorage.getItem('language') || 'fr';
};

export const setLanguageStorage = (lang) => {
  localStorage.setItem('language', lang);
  window.dispatchEvent(new Event('languageChanged'));
};

export const tKey = (key, lang = null) => {
  const current = lang || getCurrentLanguage();
  return translations[current]?.[key] || key;
};