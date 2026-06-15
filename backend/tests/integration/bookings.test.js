const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/services/bookingService');

const app = require('../../src/app');
const bookingService = require('../../src/services/bookingService');

const travelerToken = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');

describe('Booking APIs (REQ-008 to REQ-011, REQ-039 to REQ-041)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/bookings should return 201 — TEST-027', async () => {
    bookingService.createBooking.mockResolvedValue({ id: 1, status: 'Pending', userId: 1, routeId: 1, seatCount: 2, travelDate: '2026-07-15' });
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${travelerToken}`)
      .send({ routeId: 1, driverId: 1, seatCount: 2, travelDate: '2026-07-15' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('status', 'Pending');
  });

  test('POST /api/bookings duplicate should return 409 — TEST-029', async () => {
    bookingService.createBooking.mockRejectedValue({ status: 409, message: 'You already have a booking for this route on this date' });
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${travelerToken}`)
      .send({ routeId: 1, driverId: 1, seatCount: 1, travelDate: '2026-07-15' });
    expect(res.status).toBe(409);
  });

  test('POST /api/bookings with incorrect date should return 400', async () => {
    bookingService.createBooking.mockRejectedValue({ status: 400, message: 'Booking date must match the route departure date' });
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${travelerToken}`)
      .send({ routeId: 1, driverId: 1, seatCount: 1, travelDate: '2026-07-16' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Booking date must match the route departure date');
  });

  test('GET /api/bookings should return 200 — TEST-032', async () => {
    bookingService.getUserBookings.mockResolvedValue({ data: [], page: 1, limit: 10, totalPages: 0, totalItems: 0 });
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${travelerToken}`);
    expect(res.status).toBe(200);
  });

  test('PUT /api/bookings/1/cancel should return 200 — TEST-039', async () => {
    bookingService.cancelBooking.mockResolvedValue({ id: 1, status: 'Cancelled' });
    const res = await request(app)
      .put('/api/bookings/1/cancel')
      .set('Authorization', `Bearer ${travelerToken}`);
    expect(res.status).toBe(200);
  });

  test('POST /api/bookings without auth should return 401 — TEST-031', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ routeId: 1, driverId: 1, seatCount: 2, travelDate: '2026-07-15' });
    expect(res.status).toBe(401);
  });
});
