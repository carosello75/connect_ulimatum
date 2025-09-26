const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('auth_token') || '';
}

async function request(path, { method = 'GET', body, auth = false, isFormData = false } = {}) {
  const headers = {};
  
  // Se non è FormData, usa JSON
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Token inviato:', token.substring(0, 20) + '...');
    } else {
      console.log('Nessun token trovato');
    }
  }
  
  console.log('API Request:', {
    url: `${API_BASE}${path}`,
    method,
    headers,
    body: isFormData ? 'FormData' : (body ? JSON.stringify(body) : undefined)
  });
  
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
  });
  
  console.log('API Response:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok
  });
  
  if (!res.ok) {
    let detail = 'Request failed';
    try { 
      const json = await res.json(); 
      detail = json.error || json.message || detail;
      console.error('API Error Response:', json);
    } catch (e) {
      console.error('Error parsing response:', e);
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
  resetPassword: (token, newPassword) => request('/api/auth/reset-password', { method: 'POST', body: { token, newPassword } }),
  deleteAccount: (password, reason) => request('/api/auth/delete-account', { method: 'POST', body: { password, reason }, auth: true }),
  updateProfile: (profileData, image) => {
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (profileData[key]) formData.append(key, profileData[key]);
    });
    if (image) formData.append('image', image);
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
  addPost: (content) => request('/api/posts', { method: 'POST', body: { content }, auth: true }),
  notifications: () => request('/api/notifications', { auth: true }),
};


