import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Send, Home, User, Plus, Image, Video, Bell, Users, Trash2, MoreHorizontal, Edit3, ExternalLink, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { api, getApiBase } from './api.js';

const SimpleSocialApp = () => {
  // Stati principali
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Stati per il form
  const [newPost, setNewPost] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Stati per commenti (separati per post)
  const [showComments, setShowComments] = useState(null);
  const [newComments, setNewComments] = useState({});
  const [comments, setComments] = useState({});
  
  // Stati per notifiche e utenti online
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Stati per condivisione social
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Stati per profili pubblici
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  
  // Stati per autenticazione
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', name: '', email: '', password: '', confirmPassword: '' });
  const [isRegister, setIsRegister] = useState(false);
  
  // Stati per sicurezza password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  // Stati per eliminazione account
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteCustomReason, setDeleteCustomReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  
  // Stati per impostazioni profilo
  const [showSettings, setShowSettings] = useState(false);
  const [profileSettings, setProfileSettings] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    website: '',
    location: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Carica utente al mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    if (token && userData) {
      const user = JSON.parse(userData);
      setUser(user);
      setProfileSettings({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        website: user.website || '',
        location: user.location || ''
      });
      loadPosts();
      loadNotifications();
      loadOnlineUsers();
      
      // Refresh automatico degli utenti online ogni 30 secondi
      const onlineInterval = setInterval(() => {
        loadOnlineUsers();
      }, 30000);
      
      return () => clearInterval(onlineInterval);
    } else {
      setShowLogin(true);
    }
  }, []);

  // Verifica token di reset
  const verifyResetToken = async (token) => {
    try {
      await api.verifyResetToken(token);
      setResetToken(token);
      setShowResetForm(true);
    } catch (error) {
      alert('Token non valido o scaduto: ' + error.message);
      // Rimuovi il token dall'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Carica profilo pubblico
  const loadUserProfile = async (username) => {
    try {
      const response = await api.profile(username);
      setProfileUser(response.user);
      setProfilePosts(response.user.posts || []);
      setShowProfile(true);
    } catch (error) {
      alert('Errore nel caricamento del profilo: ' + error.message);
    }
  };

  // Carica notifiche - Paradigma semplificato per desktop e mobile
  const loadNotifications = async () => {
    try {
      console.log('🔔 Loading notifications...');
      
      // Usa API base dinamica
      const apiBase = getApiBase();
      
      const response = await fetch(`${apiBase}/api/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Notifications response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle notifiche');
      }
      
      const data = await response.json();
      console.log('✅ Notifications loaded:', data.notifications?.length || 0, 'notifications');
      
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('❌ Errore nel caricamento delle notifiche:', error);
      setNotifications([]);
    }
  };

  // Carica utenti online
  const loadOnlineUsers = async () => {
    try {
      console.log('👥 Loading online users...');
      
      // Usa API base dinamica
      const apiBase = getApiBase();
      
      const response = await fetch(`${apiBase}/api/online-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Online users response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento degli utenti online');
      }
      
      const onlineUsers = await response.json();
      console.log('✅ Online users loaded:', onlineUsers.length, 'users');
      
      setOnlineUsers(onlineUsers);
    } catch (error) {
      console.error('❌ Errore nel caricamento degli utenti online:', error);
      // Fallback: mostra solo l'utente corrente
      if (user) {
        setOnlineUsers([
          { 
            id: user.id, 
            name: user.name, 
            avatar: user.name?.charAt(0) || 'U', 
            status: 'online' 
          }
        ]);
      } else {
        setOnlineUsers([]);
      }
    }
  };

  // Carica i post - Paradigma semplificato per desktop e mobile
  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log('📝 Loading posts...');
      
      // Usa API base dinamica
      const apiBase = getApiBase();
      
      const response = await fetch(`${apiBase}/api/posts/feed`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Posts response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei post');
      }
      
      const posts = await response.json();
      console.log('✅ Posts loaded:', posts.length, 'posts');
      
      setPosts(posts);
    } catch (error) {
      console.error('❌ Errore nel caricamento dei post:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Login - Fix per problemi di autenticazione
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validazione input
    if (!loginData.email || !loginData.password) {
      alert('Inserisci email e password');
      return;
    }
    
    // Mostra loading
    setLoading(true);
    
    try {
      console.log('🔐 Login attempt:', {
        email: loginData.email,
        timestamp: new Date().toISOString()
      });
      
    // Usa API base dinamica
    const apiBase = getApiBase();
      
      console.log('🌐 API Base:', apiBase);
      
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Credenziali non valide');
      }
      
      const data = await response.json();
      console.log('✅ Login success:', {
        user: data.user?.name,
        token: data.token ? 'present' : 'missing'
      });
      
      // Salva i dati
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
      setShowLogin(false);
      
      // Forza il refresh dell'app
      console.log('🔄 Forzando refresh dell\'app...');
      setTimeout(() => {
        console.log('📝 Caricando post...');
        loadPosts();
        console.log('🔔 Caricando notifiche...');
        loadNotifications();
        console.log('👥 Caricando utenti online...');
        loadOnlineUsers();
      }, 100);
      
      alert('Login effettuato con successo!');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Errore nel login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Registrazione
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validazione password
    if (registerData.password !== registerData.confirmPassword) {
      alert('Le password non coincidono!');
      return;
    }
    
    const passwordValidation = validatePassword(registerData.password);
    if (!passwordValidation.isValid) {
      alert('La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale!');
      return;
    }
    
    try {
      const response = await api.register(
        registerData.username,
        registerData.email,
        registerData.password,
        registerData.name
      );
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      setUser(response.user);
      setShowLogin(false);
      loadPosts();
    } catch (error) {
      alert('Errore nella registrazione: ' + error.message);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setPosts([]);
    setShowLogin(true);
  };

  // Gestione password dimenticata
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await api.forgotPassword(forgotPasswordEmail);
      alert(`Email di reset inviata! Link di reset: ${response.resetLink}`);
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
      
      // Se c'è un link di reset, apri il modal di reset
      if (response.resetLink) {
        const url = new URL(response.resetLink);
        const token = url.searchParams.get('token');
        if (token) {
          setResetToken(token);
          setShowResetForm(true);
        }
      }
    } catch (error) {
      alert('Errore nell\'invio dell\'email: ' + error.message);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('Le password non coincidono!');
      return;
    }
    try {
      const response = await api.resetPassword(resetToken, newPassword);
      alert('Password aggiornata con successo!');
      setShowResetForm(false);
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      alert('Errore nel reset della password: ' + error.message);
    }
  };

  // Validazione password
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    };
  };

  // Eliminazione account
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!deletePassword) {
      alert('Inserisci la password per confermare l\'eliminazione');
      return;
    }
    
    if (!deleteReason) {
      alert('Seleziona un motivo per l\'eliminazione');
      return;
    }
    
    const finalReason = deleteReason === 'other' ? deleteCustomReason : deleteReason;
    
    if (!confirm(`Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.\n\nMotivo: ${finalReason}`)) {
      return;
    }
    
    try {
      const response = await api.deleteAccount(deletePassword, finalReason);
      alert('Account eliminato con successo');
      
      // Logout e redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      setPosts([]);
      setShowLogin(true);
      setShowDeleteAccount(false);
      
      // Reset form
      setDeleteReason('');
      setDeleteCustomReason('');
      setDeletePassword('');
    } catch (error) {
      alert('Errore nell\'eliminazione dell\'account: ' + error.message);
    }
  };

  // Gestione immagine profilo
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfileImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Salva impostazioni profilo
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updateProfile(profileSettings, profileImage);
      alert('Profilo aggiornato con successo');
      
      // Aggiorna l'utente con i nuovi dati
      const updatedUser = { ...user, ...response.user };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      
      // Reset dell'immagine profilo
      setProfileImage(null);
      setProfileImagePreview(null);
      
      setShowSettings(false);
    } catch (error) {
      alert('Errore nell\'aggiornamento del profilo: ' + error.message);
    }
  };

  // Cambia password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      alert('Le password non coincidono');
      return;
    }
    
    const passwordValidation = validatePassword(changePasswordData.newPassword);
    if (!passwordValidation.isValid) {
      alert('La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale!');
      return;
    }
    
    try {
      const response = await api.changePassword(changePasswordData.currentPassword, changePasswordData.newPassword);
      alert('Password cambiata con successo');
      setShowChangePassword(false);
      setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('Errore nel cambio password: ' + error.message);
    }
  };

  // Crea post
  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedFile) return;
    
    try {
      setLoading(true);
      console.log('📝 Creating post:', {
        hasContent: !!newPost.trim(),
        hasFile: !!selectedFile,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size
      });
      
      // Prepara il contenuto con titolo e descrizione
      const fullContent = generatedTitle && generatedDescription 
        ? `${generatedTitle}\n\n${generatedDescription}\n\n---\n\n${newPost}`
        : newPost;
      
      // Usa API base dinamica
      const apiBase = getApiBase();
      
      if (selectedFile) {
        // Post con media - chiamata diretta
        const formData = new FormData();
        formData.append('content', fullContent);
        formData.append('media', selectedFile);
        
        console.log('📤 Uploading file:', selectedFile.name);
        
        const response = await fetch(`${apiBase}/api/posts/feed`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: formData
        });
        
        console.log('📡 Upload response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Errore nel caricamento del file');
        }
        
        const result = await response.json();
        console.log('✅ Post con media creato:', result);
      } else {
        // Post solo testo - chiamata diretta
        const response = await fetch(`${apiBase}/api/posts/feed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ content: fullContent })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Errore nella creazione del post');
        }
        
        const result = await response.json();
        console.log('✅ Post creato:', result);
      }
      
      setNewPost('');
      setSelectedFile(null);
      setFilePreview(null);
      setGeneratedTitle('');
      setGeneratedDescription('');
      
      // Ricarica i post per mostrare il nuovo post
      await loadPosts();
      
      alert('Post pubblicato con successo!');
      
    } catch (error) {
      console.error('❌ Errore nella creazione del post:', error);
      alert('Errore nella creazione del post: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gestisce il file selezionato
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selezionato:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      // Validazione dimensione (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File troppo grande! Massimo 10MB');
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
        console.log('Preview generato:', e.target.result.substring(0, 50) + '...');
      };
      reader.readAsDataURL(file);
      
      // Genera automaticamente titolo e descrizione per i media
      setTimeout(() => {
        generateContent();
      }, 500);
    }
  };

  // Rimuove il file selezionato
  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setGeneratedTitle('');
    setGeneratedDescription('');
  };

  // Genera titolo e descrizione basati sul contenuto
  const generateContent = async () => {
    if (!newPost.trim() && !selectedFile) return;
    
    setIsGenerating(true);
    
    try {
      // Simuliamo una generazione AI basata sul contenuto
      const content = newPost.trim();
      const hasMedia = !!selectedFile;
      
      let title = '';
      let description = '';
      
      if (hasMedia && content) {
        // Post con media e testo
        title = `📸 ${content.split(' ').slice(0, 5).join(' ')}...`;
        description = `Un momento speciale condiviso: ${content}`;
      } else if (hasMedia) {
        // Solo media
        const mediaType = selectedFile.type.startsWith('image/') ? '📸 Immagine' : '🎥 Video';
        title = `${mediaType} condivisa`;
        description = `Un ${mediaType.toLowerCase()} interessante da condividere con la community`;
      } else if (content) {
        // Solo testo
        const words = content.split(' ');
        if (words.length > 10) {
          title = `${words.slice(0, 6).join(' ')}...`;
          description = content;
        } else {
          title = content;
          description = `Un pensiero condiviso: ${content}`;
        }
      }
      
      // Aggiungiamo emoji e formattazione
      if (content.includes('?')) {
        title = `🤔 ${title}`;
        description = `Una domanda interessante: ${description}`;
      } else if (content.includes('!')) {
        title = `🎉 ${title}`;
        description = `Un momento emozionante: ${description}`;
      } else if (content.includes('grazie') || content.includes('thank')) {
        title = `🙏 ${title}`;
        description = `Un ringraziamento sincero: ${description}`;
      }
      
      setGeneratedTitle(title);
      setGeneratedDescription(description);
      
    } catch (error) {
      console.error('Errore nella generazione:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Like post
  const handleLike = async (postId) => {
    try {
      await api.like(postId);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, user_liked: !post.user_liked, likes_count: post.likes_count + (post.user_liked ? -1 : 1) }
          : post
      ));
    } catch (error) {
      console.error('Errore nel like:', error);
    }
  };

  // Condividi post
  const handleShare = async (postId) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Post interessante',
          text: 'Guarda questo post!',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiato negli appunti!');
      }
    } catch (error) {
      console.error('Errore nella condivisione:', error);
    }
  };

  // Apri modal condivisione social
  const openShareModal = (post) => {
    setSelectedPost(post);
    setShowShareModal(true);
  };

  // Chiudi modal condivisione
  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedPost(null);
  };

  // Condividi su social network specifico
  const shareToSocial = (platform, post) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const postText = post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content;
    const hashtags = '#Connect #socialnetwork #post';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(postUrl)}&hashtags=${encodeURIComponent(hashtags)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${postText} ${postUrl}`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postText)}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(postText)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(postUrl)}&description=${encodeURIComponent(postText)}`;
        break;
      case 'tiktok':
        // TikTok non ha API di condivisione diretta, copiamo il link
        navigator.clipboard.writeText(`${postText} ${postUrl}`);
        alert('Link copiato! Incollalo su TikTok');
        return;
      case 'instagram':
        // Instagram non ha API di condivisione diretta, copiamo il link
        navigator.clipboard.writeText(`${postText} ${postUrl}`);
        alert('Link copiato! Incollalo su Instagram');
        return;
      case 'youtube':
        // YouTube non ha API di condivisione diretta, copiamo il link
        navigator.clipboard.writeText(`${postText} ${postUrl}`);
        alert('Link copiato! Incollalo su YouTube');
        return;
      default:
        return;
    }
    
    // Apri il link di condivisione in una nuova finestra
    window.open(shareUrl, '_blank', 'width=600,height=400');
    closeShareModal();
  };

  // Carica commenti per un post
  const loadComments = async (postId) => {
    try {
      console.log('💬 Loading comments for post:', postId);
      
      // Usa API base dinamica
      const apiBase = getApiBase();
      
      const response = await fetch(`${apiBase}/api/posts/${postId}/comments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Comments response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei commenti');
      }
      
      const data = await response.json();
      console.log('✅ Comments loaded:', data.comments?.length || 0, 'comments');
      
      setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
    } catch (error) {
      console.error('❌ Errore nel caricamento dei commenti:', error);
      setComments(prev => ({ ...prev, [postId]: [] }));
    }
  };

  // Aggiungi commento
  const handleAddComment = async (postId) => {
    const content = newComments[postId]?.trim() || '';
    if (!content) return;
    
    try {
      console.log('💬 Adding comment to post:', postId);
      
      const response = await fetch(`${getApiBase()}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      console.log('📡 Add comment response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Errore nell\'aggiunta del commento');
      }
      
      const result = await response.json();
      console.log('✅ Comment added:', result);
      
      setNewComments({ ...newComments, [postId]: '' });
      await loadComments(postId);
      
      // Aggiorna il contatore commenti nel post
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));
    } catch (error) {
      console.error('❌ Errore nell\'aggiunta del commento:', error);
      alert('Errore nell\'aggiunta del commento: ' + error.message);
    }
  };

  // Elimina commento - Paradigma semplificato
  const handleDeleteComment = async (commentId, postId) => {
    if (!confirm('Sei sicuro di voler eliminare questo commento?')) return;
    
    try {
      console.log('🗑️ Deleting comment:', commentId);
      
      // Usa API base dinamica
      const apiBase = getApiBase();
      
      const response = await fetch(`${apiBase}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Delete comment response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del commento');
      }
      
      console.log('✅ Comment deleted');
      
      await loadComments(postId);
      
      // Aggiorna il contatore commenti nel post
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments_count: Math.max((post.comments_count || 0) - 1, 0) }
          : post
      ));
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione del commento:', error);
      alert('Errore nell\'eliminazione del commento: ' + error.message);
    }
  };

  // Elimina post
  const handleDeletePost = async (postId) => {
    if (!confirm('Sei sicuro di voler eliminare questo post? Questa azione non può essere annullata.')) return;
    
    try {
      console.log('Tentativo di eliminare post:', postId);
      console.log('Token di autenticazione:', localStorage.getItem('auth_token'));
      
      const result = await api.deletePost(postId);
      console.log('Post eliminato con successo:', result);
      
      // Rimuovi il post dalla lista
      setPosts(posts.filter(post => post.id !== postId));
      
      // Chiudi i commenti se erano aperti per questo post
      if (showComments === postId) {
        setShowComments(null);
      }
    } catch (error) {
      console.error('Errore completo:', error);
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      alert('Errore nell\'eliminare il post: ' + error.message);
    }
  };

  // Toggle commenti
  const toggleComments = (postId) => {
    if (showComments === postId) {
      setShowComments(null);
    } else {
      setShowComments(postId);
      if (!comments[postId]) {
        loadComments(postId);
      }
    }
  };

  // Funzione per rilevare e convertire link YouTube
  const extractYouTubeVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Funzione per rilevare altri link video
  const extractVideoLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    return urls.filter(url => {
      return url.includes('youtube.com') || 
             url.includes('youtu.be') || 
             url.includes('vimeo.com') || 
             url.includes('dailymotion.com') ||
             url.includes('twitch.tv');
    });
  };

  // Componente per renderizzare video embed
  const VideoEmbed = ({ url }) => {
    const youtubeId = extractYouTubeVideoId(url);
    
    if (youtubeId) {
      return (
        <div className="mt-3">
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      );
    }
    
    // Per altri video, mostriamo il link
    return (
      <div className="mt-3 p-3 bg-gray-800 rounded-lg">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
        >
          <Video className="w-4 h-4" />
          <span>Guarda il video</span>
        </a>
      </div>
    );
  };

  // Se non è loggato, mostra login
  if (showLogin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <h1 className="text-2xl font-bold text-blue-400">Connect</h1>
            </div>
            <p className="text-gray-400 text-sm">Connetti, Condividi, Comunica</p>
            <h2 className="text-xl font-bold mt-4">
              {isRegister ? 'Registrati' : 'Accedi'}
            </h2>
          </div>
          
          {isRegister ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Nome completo"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Conferma Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Indicatori validazione password */}
              {registerData.password && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400">Requisiti password:</div>
                  <div className="space-y-1">
                    <div className={`text-xs flex items-center space-x-2 ${validatePassword(registerData.password).minLength ? 'text-green-400' : 'text-red-400'}`}>
                      <span>{validatePassword(registerData.password).minLength ? '✓' : '✗'}</span>
                      <span>Almeno 8 caratteri</span>
                    </div>
                    <div className={`text-xs flex items-center space-x-2 ${validatePassword(registerData.password).hasUpperCase ? 'text-green-400' : 'text-red-400'}`}>
                      <span>{validatePassword(registerData.password).hasUpperCase ? '✓' : '✗'}</span>
                      <span>Una lettera maiuscola</span>
                    </div>
                    <div className={`text-xs flex items-center space-x-2 ${validatePassword(registerData.password).hasLowerCase ? 'text-green-400' : 'text-red-400'}`}>
                      <span>{validatePassword(registerData.password).hasLowerCase ? '✓' : '✗'}</span>
                      <span>Una lettera minuscola</span>
                    </div>
                    <div className={`text-xs flex items-center space-x-2 ${validatePassword(registerData.password).hasNumbers ? 'text-green-400' : 'text-red-400'}`}>
                      <span>{validatePassword(registerData.password).hasNumbers ? '✓' : '✗'}</span>
                      <span>Un numero</span>
                    </div>
                    <div className={`text-xs flex items-center space-x-2 ${validatePassword(registerData.password).hasSpecialChar ? 'text-green-400' : 'text-red-400'}`}>
                      <span>{validatePassword(registerData.password).hasSpecialChar ? '✓' : '✗'}</span>
                      <span>Un carattere speciale</span>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
              >
                Registrati
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Password dimenticata?
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition-colors"
              >
                Accedi
              </button>
            </form>
          )}
          
          <div className="text-center mt-4">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-500 hover:text-blue-400"
            >
              {isRegister ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="mobile-header border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-blue-400">Connect</h1>
          </div>
          <div className="flex items-center space-x-2 mobile-text">
            <span className="text-sm hidden md:block">{user?.name}</span>
            <button
              onClick={() => setShowSettings(true)}
              className="mobile-button bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              ⚙️
            </button>
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="mobile-button bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              🗑️
            </button>
            <button
              onClick={handleLogout}
              className="mobile-button bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mobile-grid flex">
        {/* Sidebar sinistra - Notifiche */}
        <div className="mobile-sidebar w-80 p-4 border-r border-gray-800">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5" />
            <h2 className="text-lg font-bold">Notifiche</h2>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="bg-gray-900 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'like' ? 'bg-red-500' :
                      notification.type === 'comment' ? 'bg-blue-500' :
                      notification.type === 'follow' ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm">{notification.message}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 mb-4 mt-8">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-bold">Utenti Online</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {onlineUsers.map((onlineUser) => (
              <div key={onlineUser.id} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">
                  {onlineUser.avatar}
                </div>
                <span className="text-sm">{onlineUser.name}</span>
                <div className={`w-2 h-2 rounded-full ${
                  onlineUser.status === 'online' ? 'bg-green-500' :
                  onlineUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Contenuto principale */}
        <div className="mobile-main flex-1 p-4">
        {/* Form per nuovo post */}
        <div className="mobile-form bg-gray-900 p-4 rounded-lg mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Cosa sta succedendo?"
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none border-none outline-none min-h-[100px] text-lg"
                rows="3"
              />
              
              {/* Preview del file */}
              {filePreview && (
                <div className="mt-3 relative">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded-lg object-cover"
                  />
                  <button
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Pulsante per generare titolo e descrizione */}
              {(newPost.trim() || selectedFile) && (
                <div className="mt-3">
                  <button
                    onClick={generateContent}
                    disabled={isGenerating}
                    className="bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
                  >
                    {isGenerating ? 'Generando...' : '✨ Genera Titolo e Descrizione'}
                  </button>
                </div>
              )}
              
              {/* Preview video embed se contiene link YouTube */}
              {(() => {
                const videoLinks = extractVideoLinks(newPost);
                return videoLinks.map((url, index) => (
                  <div key={index} className="mt-3">
                    <VideoEmbed url={url} />
                  </div>
                ));
              })()}
              
              {/* Mostra titolo e descrizione generati */}
              {generatedTitle && generatedDescription && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg border border-purple-700">
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide">Titolo Generato</label>
                      <h3 className="text-lg font-bold text-white leading-tight">{generatedTitle}</h3>
                    </div>
                    <div>
                      <label className="text-xs text-purple-300 font-semibold uppercase tracking-wide">Descrizione</label>
                      <p className="text-sm text-gray-200 leading-relaxed">{generatedDescription}</p>
                    </div>
                    <button
                      onClick={() => {
                        setGeneratedTitle('');
                        setGeneratedDescription('');
                      }}
                      className="text-xs text-purple-300 hover:text-purple-200 underline"
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-2">
                  <label className="text-blue-500 hover:bg-blue-900 hover:bg-opacity-20 p-2 rounded-full cursor-pointer">
                    <Image className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <label className="text-blue-500 hover:bg-blue-900 hover:bg-opacity-20 p-2 rounded-full cursor-pointer">
                    <Video className="w-5 h-5" />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() && !selectedFile}
                  className="bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  Posta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista post */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Caricamento...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="mobile-post bg-gray-900 p-4 rounded-lg group">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    {post.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => loadUserProfile(post.username)}
                          className="font-bold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {post.name}
                        </button>
                        <button
                          onClick={() => loadUserProfile(post.username)}
                          className="text-gray-500 text-sm hover:text-blue-400 hover:underline"
                        >
                          @{post.username}
                        </button>
                        <span className="text-gray-500 text-sm">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Menu azioni per il post */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Verifica se l'utente può eliminare il post */}
                        {user?.id === post.user_id && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-900 hover:bg-opacity-20 transition-colors"
                            title="Elimina post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Menu più opzioni */}
                        <div className="relative">
                          <button className="text-gray-400 hover:text-gray-300 p-2 rounded-full hover:bg-gray-700 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenuto del post con formattazione migliorata */}
                    <div className="text-white mb-3">
                      {post.content.split('\n\n---\n\n').length > 1 ? (
                        // Post con titolo e descrizione generati
                        <div className="space-y-4">
                          <div className="border-l-4 border-purple-500 pl-4">
                            <h2 className="text-xl font-bold text-purple-300 mb-2">
                              {post.content.split('\n\n---\n\n')[0].split('\n\n')[0]}
                            </h2>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {post.content.split('\n\n---\n\n')[0].split('\n\n')[1]}
                            </p>
                          </div>
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-white leading-relaxed">
                              {post.content.split('\n\n---\n\n')[1]}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Post normale
                        <p className="leading-relaxed">{post.content}</p>
                      )}
                    </div>
                    
                    {post.image_url && (
                      <img
                        src={`${getApiBase()}${post.image_url}`}
                        alt="Post image"
                        className="max-w-full rounded-lg mb-3"
                      />
                    )}
                    
                    {post.video_url && (
                      <video
                        src={`${getApiBase()}${post.video_url}`}
                        controls
                        className="max-w-full rounded-lg mb-3"
                      />
                    )}
                    
                    {/* Supporto per video embed da link */}
                    {(() => {
                      const videoLinks = extractVideoLinks(post.content);
                      return videoLinks.map((url, index) => (
                        <VideoEmbed key={index} url={url} />
                      ));
                    })()}
                    
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 ${
                          post.user_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-current' : ''}`} />
                        <span>{post.likes_count || 0}</span>
                      </button>
                      
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="text-gray-500 hover:text-blue-500 flex items-center space-x-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments_count || 0}</span>
                      </button>
                      
                      <button
                        onClick={() => openShareModal(post)}
                        className="text-gray-500 hover:text-blue-500"
                        title="Condividi su social network"
                      >
                        <Share className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Sezione commenti */}
                    {showComments === post.id && (
                      <div className="mt-4 border-t border-gray-700 pt-4">
                        {/* Form per nuovo commento */}
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                            {user?.avatar ? (
                              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white">{user?.name?.charAt(0) || 'U'}</span>
                            )}
                          </div>
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="text"
                              value={newComments[post.id] || ''}
                              onChange={(e) => setNewComments({...newComments, [post.id]: e.target.value})}
                              placeholder="Scrivi un commento..."
                              className="flex-1 bg-gray-800 text-white placeholder-gray-500 px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newComments[post.id]?.trim()}
                              className="bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Invia
                            </button>
                          </div>
                        </div>
                        
                        {/* Lista commenti */}
                        <div className="space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex items-start space-x-3 group">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm">
                                {comment.name?.charAt(0) || 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-sm">{comment.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {/* Menu azioni per il commento */}
                                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Verifica se l'utente può eliminare il commento */}
                                    {(user?.id === comment.user_id || user?.id === post.user_id) && (
                                      <button
                                        onClick={() => handleDeleteComment(comment.id, post.id)}
                                        className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-900 hover:bg-opacity-20 transition-colors"
                                        title="Elimina commento"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    {/* Menu più opzioni */}
                                    <div className="relative">
                                      <button className="text-gray-400 hover:text-gray-300 p-1 rounded-full hover:bg-gray-700 transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      
      {/* Modal condivisione social */}
      {showShareModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Condividi su</h3>
              <button
                onClick={closeShareModal}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Facebook */}
              <button
                onClick={() => shareToSocial('facebook', selectedPost)}
                className="flex flex-col items-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <div className="text-white font-bold text-lg mb-1">f</div>
                <span className="text-white text-xs">Facebook</span>
              </button>
              
              {/* Twitter */}
              <button
                onClick={() => shareToSocial('twitter', selectedPost)}
                className="flex flex-col items-center p-4 bg-blue-400 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <div className="text-white font-bold text-lg mb-1">𝕏</div>
                <span className="text-white text-xs">Twitter</span>
              </button>
              
              {/* LinkedIn */}
              <button
                onClick={() => shareToSocial('linkedin', selectedPost)}
                className="flex flex-col items-center p-4 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                <div className="text-white font-bold text-lg mb-1">in</div>
                <span className="text-white text-xs">LinkedIn</span>
              </button>
              
              {/* WhatsApp */}
              <button
                onClick={() => shareToSocial('whatsapp', selectedPost)}
                className="flex flex-col items-center p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <div className="text-white font-bold text-lg mb-1">WA</div>
                <span className="text-white text-xs">WhatsApp</span>
              </button>
              
              {/* Telegram */}
              <button
                onClick={() => shareToSocial('telegram', selectedPost)}
                className="flex flex-col items-center p-4 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                <div className="text-white font-bold text-lg mb-1">TG</div>
                <span className="text-white text-xs">Telegram</span>
              </button>
              
              {/* Reddit */}
              <button
                onClick={() => shareToSocial('reddit', selectedPost)}
                className="flex flex-col items-center p-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                <div className="text-white font-bold text-lg mb-1">R</div>
                <span className="text-white text-xs">Reddit</span>
              </button>
              
              {/* Pinterest */}
              <button
                onClick={() => shareToSocial('pinterest', selectedPost)}
                className="flex flex-col items-center p-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <div className="text-white font-bold text-lg mb-1">P</div>
                <span className="text-white text-xs">Pinterest</span>
              </button>
              
              {/* TikTok */}
              <button
                onClick={() => shareToSocial('tiktok', selectedPost)}
                className="flex flex-col items-center p-4 bg-black hover:bg-gray-800 rounded-lg transition-colors border border-gray-600"
              >
                <div className="text-white font-bold text-lg mb-1">TT</div>
                <span className="text-white text-xs">TikTok</span>
              </button>
              
              {/* Instagram */}
              <button
                onClick={() => shareToSocial('instagram', selectedPost)}
                className="flex flex-col items-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors"
              >
                <div className="text-white font-bold text-lg mb-1">IG</div>
                <span className="text-white text-xs">Instagram</span>
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${selectedPost.content} ${window.location.origin}/post/${selectedPost.id}`);
                  alert('Link copiato negli appunti!');
                  closeShareModal();
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Copia Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Password Dimenticata */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Password Dimenticata</h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-gray-300 text-sm mb-4">
                Inserisci la tua email per ricevere un link di reset password.
              </div>
              
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Invia Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal Reset Password */}
      {showResetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Reset Password</h3>
              <button
                onClick={() => setShowResetForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-gray-300 text-sm mb-4">
                Inserisci il token ricevuto via email e la nuova password.
              </div>
              
              <input
                type="text"
                placeholder="Token di reset"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                required
              />
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nuova Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Conferma Nuova Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowResetForm(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal Eliminazione Account */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-400">Elimina Account</h3>
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="text-gray-300 text-sm mb-4">
                <p className="mb-2">⚠️ <strong>Attenzione:</strong> Questa azione è irreversibile!</p>
                <p>Tutti i tuoi dati, post, commenti e informazioni verranno eliminati permanentemente.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Motivo dell'eliminazione:
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                  required
                >
                  <option value="">Seleziona un motivo</option>
                  <option value="not_using">Non uso più la piattaforma</option>
                  <option value="privacy_concerns">Problemi di privacy</option>
                  <option value="too_much_content">Troppi contenuti non rilevanti</option>
                  <option value="technical_issues">Problemi tecnici</option>
                  <option value="found_alternative">Ho trovato un'alternativa migliore</option>
                  <option value="other">Altro</option>
                </select>
              </div>
              
              {deleteReason === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Specifica il motivo:
                  </label>
                  <textarea
                    value={deleteCustomReason}
                    onChange={(e) => setDeleteCustomReason(e.target.value)}
                    placeholder="Descrivi il motivo dell'eliminazione..."
                    className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none h-20 resize-none"
                    required
                  />
                </div>
              )}
              
              <div className="relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  placeholder="Conferma password per eliminare"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showDeletePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccount(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Elimina Definitivamente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal Impostazioni Profilo */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">⚙️ Impostazioni Profilo</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sezione Informazioni Personali */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-400">Informazioni Personali</h4>
                
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Foto Profilo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Foto Profilo
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                        {profileImagePreview ? (
                          <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : user?.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xl">{user?.name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                        id="profile-image"
                      />
                      <label
                        htmlFor="profile-image"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                      >
                        Cambia Foto
                      </label>
                    </div>
                  </div>
                  
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={profileSettings.name}
                      onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                      className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileSettings.username}
                      onChange={(e) => setProfileSettings({...profileSettings, username: e.target.value})}
                      className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                      className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileSettings.bio}
                      onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                      placeholder="Racconta qualcosa di te..."
                      className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none h-20 resize-none"
                    />
                  </div>
                  
                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={profileSettings.website}
                      onChange={(e) => setProfileSettings({...profileSettings, website: e.target.value})}
                      placeholder="https://..."
                      className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Località
                    </label>
                    <input
                      type="text"
                      value={profileSettings.location}
                      onChange={(e) => setProfileSettings({...profileSettings, location: e.target.value})}
                      placeholder="Città, Paese"
                      className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    💾 Salva Profilo
                  </button>
                </form>
              </div>
              
              {/* Sezione Sicurezza */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-red-400">Sicurezza</h4>
                
                {/* Cambia Password */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h5 className="text-md font-medium text-white mb-3">Cambia Password</h5>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    🔒 Cambia Password
                  </button>
                </div>
                
                {/* Elimina Account */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h5 className="text-md font-medium text-white mb-3">Elimina Account</h5>
                  <p className="text-gray-400 text-sm mb-3">
                    Elimina permanentemente il tuo account e tutti i dati associati.
                  </p>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowDeleteAccount(true);
                    }}
                    className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    🗑️ Elimina Account
                  </button>
                </div>
                
                {/* Statistiche Account */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h5 className="text-md font-medium text-white mb-3">Statistiche Account</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Post pubblicati:</span>
                      <span className="text-white">{user?.posts_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Commenti:</span>
                      <span className="text-white">{user?.comments_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Like ricevuti:</span>
                      <span className="text-white">{user?.likes_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Membro dal:</span>
                      <span className="text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Cambia Password */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">🔒 Cambia Password</h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password Attuale"
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData({...changePasswordData, currentPassword: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nuova Password"
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData({...changePasswordData, newPassword: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Conferma Nuova Password"
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({...changePasswordData, confirmPassword: e.target.value})}
                  className="w-full p-3 pr-12 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Cambia Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal profilo pubblico */}
      {showProfile && profileUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">👤 Profilo di {profileUser.name}</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Header profilo */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-800 rounded-lg">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                {profileUser.avatar ? (
                  <img src={profileUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xl">{profileUser.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white">{profileUser.name}</h4>
                <p className="text-gray-400">@{profileUser.username}</p>
                {profileUser.bio && (
                  <p className="text-gray-300 text-sm mt-1">{profileUser.bio}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                  {profileUser.location && (
                    <span>📍 {profileUser.location}</span>
                  )}
                  {profileUser.website && (
                    <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {/* Statistiche */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{profileUser.posts_count || 0}</div>
                <div className="text-gray-400 text-sm">Post</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{profileUser.comments_count || 0}</div>
                <div className="text-gray-400 text-sm">Commenti</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{profileUser.likes_count || 0}</div>
                <div className="text-gray-400 text-sm">Like</div>
              </div>
            </div>
            
            {/* Post dell'utente */}
            <div>
              <h5 className="text-lg font-semibold text-white mb-4">📝 Post recenti</h5>
              {profilePosts.length > 0 ? (
                <div className="space-y-4">
                  {profilePosts.map((post) => (
                    <div key={post.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">{profileUser.name?.charAt(0) || 'U'}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{profileUser.name}</p>
                          <p className="text-gray-400 text-sm">@{profileUser.username}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3">{post.content}</p>
                      {post.media_url && (
                        <div className="mb-3">
                          {post.media_type === 'image' ? (
                            <img src={post.media_url} alt="Media" className="w-full h-64 object-cover rounded-lg" />
                          ) : (
                            <video src={post.media_url} controls className="w-full h-64 object-cover rounded-lg" />
                          )}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>❤️ {post.likes_count || 0}</span>
                        <span>💬 {post.comments_count || 0}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Nessun post ancora</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Reset Password */}
      {showResetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">🔒 Reset Password</h3>
              <button
                onClick={() => {
                  setShowResetForm(false);
                  setResetToken('');
                  // Rimuovi il token dall'URL
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nuova Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none pr-12"
                    placeholder="Inserisci nuova password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Conferma Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none pr-12"
                    placeholder="Conferma nuova password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetToken('');
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Sidebar Mobile Bottom - Notifiche e Utenti Online */}
      <div className="mobile-sidebar block md:hidden">
        {/* Notifiche a sinistra */}
        <div className="mobile-notifications">
          <div className="flex items-center space-x-1 mb-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white">Notifiche</h3>
          </div>
          <div className="space-y-2">
            {notifications.length > 0 ? (
              notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    notification.type === 'like' ? 'bg-red-500' :
                    notification.type === 'comment' ? 'bg-blue-500' :
                    notification.type === 'follow' ? 'bg-green-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="text-xs text-gray-300 truncate">{notification.message}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-2">
                <Bell className="w-4 h-4 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Nessuna notifica</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Utenti Online a destra */}
        <div className="mobile-online">
          <div className="flex items-center space-x-1 mb-2">
            <Users className="w-4 h-4 text-green-400" />
            <h3 className="text-xs font-bold text-white">Online</h3>
          </div>
          <div className="space-y-2">
            {onlineUsers.length > 0 ? (
              onlineUsers.slice(0, 3).map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {onlineUser.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs text-gray-300 truncate">{onlineUser.name}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-2">
                <Users className="w-4 h-4 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Nessun utente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSocialApp;
