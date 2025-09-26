// Configurazione API per sviluppo e produzione
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || 
  (window.location.hostname === 'web-production-54984.up.railway.app' 
    ? 'https://web-production-54984.up.railway.app' 
    : 'http://localhost:3001');

function getToken() {
  try {
    return localStorage.getItem('auth_token') || '';
  } catch (error) {
    console.error('Errore nel getToken:', error);
    return '';
  }
}

async function request(path, { method = 'GET', body, auth = false, isFormData = false } = {}) {
  const headers = {};
  
  // Debug per mobile
  console.log('Mobile Debug:', {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    userAgent: navigator.userAgent,
    API_BASE,
    path,
    method
  });
  
  // Se non è FormData, usa JSON
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Token mobile:', token.substring(0, 20) + '...');
    } else {
      console.log('Nessun token mobile');
    }
  }
  
  console.log('Request mobile:', {
    url: `${API_BASE}${path}`,
    headers,
    body: isFormData ? 'FormData' : (body ? JSON.stringify(body) : undefined)
  });
  
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
  });
  
  if (!res.ok) {
    let detail = 'Request failed';
    try { 
      const json = await res.json(); 
      detail = json.error || json.message || detail;
    } catch (e) {
      // Ignora errori di parsing
    }
    const error = new Error(detail);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (username, email, password, name) => request('/api/auth/register', { method: 'POST', body: { username, email, password, name } }),
  forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  verifyResetToken: (token) => request(`/api/auth/verify-reset-token/${token}`),
  resetPassword: (token, newPassword) => request('/api/auth/reset-password', { method: 'POST', body: { token, newPassword } }),
  deleteAccount: (password, reason) => request('/api/auth/delete-account', { method: 'POST', body: { password, reason }, auth: true }),
  updateProfile: (profileData, image) => {
    // Usa sempre FormData per compatibilità con il backend
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== undefined && profileData[key] !== null) {
        formData.append(key, profileData[key]);
      }
    });
    if (image) {
      formData.append('image', image);
    }
    return request('/api/profile/update', { method: 'POST', body: formData, auth: true, isFormData: true });
  },
  changePassword: (currentPassword, newPassword) => request('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword }, auth: true }),
  feed: (page = 1, limit = 10) => request(`/api/posts/feed?page=${page}&limit=${limit}`, { auth: true }),
  like: (postId) => request(`/api/posts/${postId}/like`, { method: 'POST', auth: true }),
  comments: (postId) => request(`/api/posts/${postId}/comments`),
  addComment: (postId, content) => request(`/api/posts/${postId}/comments`, { method: 'POST', body: { content }, auth: true }),
  deleteComment: (commentId) => request(`/api/comments/${commentId}`, { method: 'DELETE', auth: true }),
  deletePost: (postId) => request(`/api/posts/${postId}`, { method: 'DELETE', auth: true }),
  profile: (username) => request(`/api/users/profile/${username}`),
  stats: () => request('/api/stats', { auth: true }),
  addPost: (content, media = null) => {
    if (media) {
      // Post con media
      const formData = new FormData();
      formData.append('content', content);
      formData.append('media', media);
      return request('/api/posts', { method: 'POST', body: formData, auth: true, isFormData: true });
    } else {
      // Post solo testo
      return request('/api/posts', { method: 'POST', body: { content }, auth: true });
    }
  },
  notifications: () => request('/api/notifications', { auth: true }),
};


