const analyticsService = require('../../src/services/analyticsService');
const reportsService = require('../../src/services/reportsService');
const { Agency, Driver, Booking } = require('../../src/models');

jest.mock('../../src/models', () => {
  return {
    Agency: {
      findOne: jest.fn(),
      findAndCountAll: jest.fn().mockResolvedValue({ count: 1, rows: [] }),
    },
    Driver: {
      findAll: jest.fn(),
    },
    Booking: {
      findAll: jest.fn().mockResolvedValue([]),
    },
    Sequelize: {
      Op: {
        gte: Symbol('gte'),
        lte: Symbol('lte'),
        in: Symbol('in'),
      },
    },
  };
});

describe('Agency Tenancy Isolation Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyticsService.getBookingsByDate', () => {
    test('should query all bookings if user role is admin (no driverId filter)', async () => {
      await analyticsService.getBookingsByDate('2026-06-01', '2026-06-10', { id: 1, role: 'admin' });

      expect(Agency.findOne).not.toHaveBeenCalled();
      expect(Booking.findAll).toHaveBeenCalled();
      
      const call = Booking.findAll.mock.calls[0][0];
      expect(call).toBeDefined();
      expect(call.where).toBeDefined();
      expect(call.where.driverId).toBeUndefined();
      
      const gteKey = Object.getOwnPropertySymbols(call.where.travelDate).find(s => s.toString() === 'Symbol(gte)');
      const lteKey = Object.getOwnPropertySymbols(call.where.travelDate).find(s => s.toString() === 'Symbol(lte)');
      expect(call.where.travelDate[gteKey]).toBe('2026-06-01');
      expect(call.where.travelDate[lteKey]).toBe('2026-06-10');
    });

    test('should query only the agency drivers bookings if user role is agency_admin', async () => {
      Agency.findOne.mockResolvedValue({ id: 5 });
      Driver.findAll.mockResolvedValue([{ id: 10 }, { id: 11 }]);

      await analyticsService.getBookingsByDate('2026-06-01', '2026-06-10', { id: 2, role: 'agency_admin' });

      expect(Agency.findOne).toHaveBeenCalledWith({ where: { adminId: 2 } });
      expect(Driver.findAll).toHaveBeenCalledWith({ where: { agencyId: 5 }, attributes: ['id'] });
      expect(Booking.findAll).toHaveBeenCalled();

      const call = Booking.findAll.mock.calls[0][0];
      expect(call).toBeDefined();
      expect(call.where).toBeDefined();
      
      const inKey = Object.getOwnPropertySymbols(call.where.driverId).find(s => s.toString() === 'Symbol(in)');
      expect(call.where.driverId[inKey]).toEqual([10, 11]);
      
      const gteKey = Object.getOwnPropertySymbols(call.where.travelDate).find(s => s.toString() === 'Symbol(gte)');
      const lteKey = Object.getOwnPropertySymbols(call.where.travelDate).find(s => s.toString() === 'Symbol(lte)');
      expect(call.where.travelDate[gteKey]).toBe('2026-06-01');
      expect(call.where.travelDate[lteKey]).toBe('2026-06-10');
    });

    test('should return empty array immediately if agency_admin has no drivers', async () => {
      Agency.findOne.mockResolvedValue({ id: 5 });
      Driver.findAll.mockResolvedValue([]);

      const result = await analyticsService.getBookingsByDate('2026-06-01', '2026-06-10', { id: 2, role: 'agency_admin' });

      expect(result).toEqual([]);
      expect(Booking.findAll).not.toHaveBeenCalled();
    });

    test('should return empty array immediately if agency_admin has no agency', async () => {
      Agency.findOne.mockResolvedValue(null);

      const result = await analyticsService.getBookingsByDate('2026-06-01', '2026-06-10', { id: 2, role: 'agency_admin' });

      expect(result).toEqual([]);
      expect(Booking.findAll).not.toHaveBeenCalled();
    });
  });

  describe('reportsService.getAgencyPerformance', () => {
    test('should query all agencies if user role is admin', async () => {
      await reportsService.getAgencyPerformance(1, 10, { id: 1, role: 'admin' });

      expect(Agency.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    test('should query only own agency if user role is agency_admin', async () => {
      await reportsService.getAgencyPerformance(1, 10, { id: 3, role: 'agency_admin' });

      expect(Agency.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { adminId: 3 },
        })
      );
    });
  });
});
