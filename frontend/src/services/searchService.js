import api from './api';

export async function searchRoutes(source, destination, filters = {}) {
  const params = { source, destination, ...filters };
  const res = await api.get('/routes/search', { params });
  return res.data;
}
