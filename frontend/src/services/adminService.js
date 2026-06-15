import api from './api';

export async function getUsers(page, limit, search) {
  const params = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (search !== undefined) params.search = search;
  const args = ['/admin/users'];
  if (Object.keys(params).length) {
    args.push({ params });
  }
  const res = await api.get(...args);
  return res.data;
}

export async function toggleUserStatus(userId) {
  const res = await api.put(`/admin/users/${userId}/deactivate`);
  return res.data;
}

export async function getAgencies(page, limit, search) {
  const params = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (search !== undefined) params.search = search;
  const args = ['/admin/agencies'];
  if (Object.keys(params).length) {
    args.push({ params });
  }
  const res = await api.get(...args);
  return res.data;
}

export async function createAgency(data) {
  const res = await api.post('/admin/agencies', data);
  return res.data;
}

export async function deactivateAgency(agencyId) {
  const res = await api.put(`/admin/agencies/${agencyId}/deactivate`);
  return res.data;
}

export async function getAllBookings(page, limit, search) {
  const params = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (search !== undefined) params.search = search;
  const args = ['/admin/bookings'];
  if (Object.keys(params).length) {
    args.push({ params });
  }
  const res = await api.get(...args);
  return res.data;
}

export async function adminCancelBooking(bookingId, reason) {
  const res = await api.put(`/admin/bookings/${bookingId}/cancel`, { reason });
  return res.data;
}

