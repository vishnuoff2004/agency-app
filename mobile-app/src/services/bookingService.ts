import api from './api';

export async function searchRoutes(params: any) {
  const res = await api.get('/routes/search', { params });
  return res.data;
}

export async function createBooking(data: {
  routeId: number;
  driverId: number;
  seatCount: number;
  travelDate: string;
}) {
  const res = await api.post('/bookings', data);
  return res.data;
}

export async function getBookings(page: number, pageSize: number = 10, search: string = '') {
  const res = await api.get('/bookings', {
    params: { page, pageSize, search },
  });
  return res.data;
}

export async function getBookingDetail(id: number | string) {
  const res = await api.get(`/bookings/${id}`);
  return res.data;
}

export async function getBookingStatusHistory(id: number | string) {
  const res = await api.get(`/bookings/${id}/status-history`);
  return res.data;
}

export async function cancelBooking(id: number | string) {
  const res = await api.put(`/bookings/${id}/cancel`);
  return res.data;
}

export async function getUserProfile() {
  const res = await api.get('/users/profile');
  return res.data;
}

export async function updateUserProfile(data: { name: string; phone: string }) {
  const res = await api.put('/users/profile', data);
  return res.data;
}

export async function getNotifications(page: number, pageSize: number = 10) {
  const res = await api.get('/notifications', {
    params: { page, pageSize },
  });
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.put('/notifications/read-all');
  return res.data;
}

export async function markNotificationRead(id: number | string) {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
}

export async function getUnreadNotificationsCount() {
  const res = await api.get('/notifications/unread-count');
  return res.data;
}
