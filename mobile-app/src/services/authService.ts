import api from './api';

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function register(data: any) {
  const isForm = data instanceof FormData;
  const res = await api.post('/auth/register', data, {
    headers: {
      'Content-Type': isForm ? 'multipart/form-data' : 'application/json',
    },
  });
  return res.data;
}

export async function verifyOtp(email: string, otp: string) {
  const res = await api.post('/auth/verify-otp', { email, otp });
  return res.data;
}

export async function resendOtp(email: string) {
  const res = await api.post('/auth/resend-otp', { email });
  return res.data;
}

export async function getAgencies() {
  const res = await api.get('/routes/agencies');
  return res.data;
}
