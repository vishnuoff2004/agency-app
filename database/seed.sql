USE travel_agency;

INSERT INTO agencies (name, email, phone, active, createdAt, updatedAt) VALUES
('City Travels', 'city@travels.com', '+911234567890', true, NOW(), NOW()),
('Highway Express', 'highway@express.com', '+919876543210', true, NOW(), NOW());

INSERT INTO users (name, email, password, phone, role, active, createdAt, updatedAt) VALUES
('Admin', 'admin@travelagency.com', '$2b$10$placeholder', '+910000000000', 'admin', true, NOW(), NOW());

INSERT INTO drivers (userId, agencyId, name, phone, vehicleType, vehicleReg, licenseNo, available, createdAt, updatedAt) VALUES
(1, 1, 'Ravi Kumar', '+911111111111', 'Sedan', 'KA01AB1234', 'DL123456', true, NOW(), NOW()),
(1, 1, 'Sita Sharma', '+911111111112', 'SUV', 'KA01CD5678', 'DL789012', true, NOW(), NOW()),
(2, 2, 'Amit Singh', '+911111111113', 'Hatchback', 'MH02EF9012', 'DL345678', true, NOW(), NOW()),
(2, 2, 'Priya Patel', '+911111111114', 'Van', 'MH02GH3456', 'DL901234', true, NOW(), NOW());

INSERT INTO routes (driverId, source, destination, departureTime, arrivalTime, fare, capacity, available, status, createdAt, updatedAt) VALUES
(1, 'Mumbai', 'Pune', '2026-07-15 08:00:00', '2026-07-15 10:00:00', 500.00, 4, true, 'active', NOW(), NOW()),
(1, 'Mumbai', 'Nashik', '2026-07-15 14:00:00', '2026-07-15 17:00:00', 800.00, 4, true, 'active', NOW(), NOW()),
(2, 'Pune', 'Mumbai', '2026-07-16 09:00:00', '2026-07-16 11:00:00', 550.00, 6, true, 'active', NOW(), NOW()),
(2, 'Pune', 'Goa', '2026-07-17 06:00:00', '2026-07-17 14:00:00', 1200.00, 4, true, 'active', NOW(), NOW());
