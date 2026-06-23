import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: '/api' });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || 'Something went wrong.';
    if (err.response?.status === 401) {
      localStorage.removeItem('el_token');
      localStorage.removeItem('el_user');
      window.location.href = '/login';
    } else {
      toast.error(msg);
    }
    return Promise.reject(err);
  }
);

export default api;
