const bookingService = require('../../src/services/bookingService');
const { Booking, BookingStatusHistory, Route, Driver } = require('../../src/models');

jest.mock('../../src/models', () => {
  const mockBooking = {
    id: 100,
    userId: 1,
    routeId: 10,
    driverId: 20,
    seatCount: 2,
    travelDate: '2026-06-11',
    status: 'Pending',
    save: jest.fn(),
  };

  const mockRoute = {
    id: 10,
    driverId: 20,
    capacity: 10,
    available: true,
    status: 'active',
    departureTime: '2026-06-11T12:00:00Z',
    arrivalTime: '2026-06-12T12:00:00Z',
  };

  const mockDriver = {
    id: 20,
  };

  return {
    Booking: {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    },
    BookingStatusHistory: {
      create: jest.fn(),
    },
    Route: {
      findByPk: jest.fn().mockResolvedValue(mockRoute),
    },
    Driver: {
      findByPk: jest.fn().mockResolvedValue(mockDriver),
    },
    Sequelize: {
      Op: {
        notIn: Symbol('notIn'),
      },
    },
  };
});

describe('bookingService.createBooking unit tests', () => {
  let mockRoute;
  let mockDriver;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRoute = {
      id: 10,
      driverId: 20,
      capacity: 10,
      available: true,
      status: 'active',
      departureTime: '2026-06-11T12:00:00Z',
      arrivalTime: '2026-06-12T12:00:00Z',
    };
    mockDriver = { id: 20 };

    Route.findByPk.mockResolvedValue(mockRoute);
    Driver.findByPk.mockResolvedValue(mockDriver);
    Booking.findOne.mockResolvedValue(null);
    Booking.findAll.mockResolvedValue([]);
  });

  test('should throw error if route date does not match booking date', async () => {
    await expect(
      bookingService.createBooking(1, {
        routeId: 10,
        driverId: 20,
        seatCount: 2,
        travelDate: '2026-06-13', // mismatched date
      })
    ).rejects.toThrow('Booking date must match the route departure date');
  });

  test('should merge bookings on same route/driver/date and update seat count', async () => {
    const mockExistingBooking = {
      id: 100,
      userId: 1,
      routeId: 10,
      driverId: 20,
      seatCount: 3,
      travelDate: '2026-06-11',
      status: 'Pending',
      save: jest.fn().mockResolvedValue(true),
    };

    Booking.findOne
      .mockResolvedValueOnce(null) // exclusive vehicle: no other user
      .mockResolvedValueOnce(mockExistingBooking); // existing booking: found
    Booking.findAll.mockResolvedValue([mockExistingBooking]);

    const result = await bookingService.createBooking(1, {
      routeId: 10,
      driverId: 20,
      seatCount: 2, // adding 2 seats
      travelDate: '2026-06-11',
    });

    expect(mockExistingBooking.seatCount).toBe(5); // 3 + 2
    expect(mockExistingBooking.save).toHaveBeenCalled();
    expect(BookingStatusHistory.create).toHaveBeenCalled();
    expect(result.id).toBe(100);
  });

  test('should reject merge if seat count exceeds route capacity', async () => {
    const mockExistingBooking = {
      id: 100,
      userId: 1,
      routeId: 10,
      driverId: 20,
      seatCount: 8,
      travelDate: '2026-06-11',
      status: 'Pending',
      save: jest.fn(),
    };

    Booking.findOne
      .mockResolvedValueOnce(null) // exclusive vehicle: no other user
      .mockResolvedValueOnce(mockExistingBooking); // existing booking: found

    await expect(
      bookingService.createBooking(1, {
        routeId: 10,
        driverId: 20,
        seatCount: 3, // 8 + 3 = 11, exceeds capacity (10)
        travelDate: '2026-06-11',
      })
    ).rejects.toThrow('Seat count exceeds vehicle capacity of 10');
  });

  test('should reject creation of new booking if capacity is exceeded', async () => {
    // Other travelers booked 9 seats
    Booking.findAll.mockResolvedValue([{ seatCount: 9, status: 'Confirmed' }]);

    await expect(
      bookingService.createBooking(1, {
        routeId: 10,
        driverId: 20,
        seatCount: 2, // 9 + 2 = 11, exceeds capacity (10)
        travelDate: '2026-06-11',
      })
    ).rejects.toThrow('Seat count exceeds vehicle capacity of 10');
  });

  test('should create new booking when everything matches and seats are available', async () => {
    Booking.findOne.mockResolvedValue(null);
    Booking.findAll.mockResolvedValue([{ seatCount: 5, status: 'Confirmed' }]);
    Booking.create.mockResolvedValue({ id: 101, status: 'Pending' });

    const result = await bookingService.createBooking(1, {
      routeId: 10,
      driverId: 20,
      seatCount: 2, // 5 + 2 = 7 <= 10
      travelDate: '2026-06-11',
    });

    expect(Booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        routeId: 10,
        driverId: 20,
        seatCount: 2,
        travelDate: '2026-06-11',
        status: 'Pending',
      })
    );
    expect(result.id).toBe(101);
  });
});
