CREATE DATABASE IF NOT EXISTS travel_agency;
USE travel_agency;

-- Add status column to Routes table (idempotent via information_schema check)
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'travel_agency' AND TABLE_NAME = 'Routes' AND COLUMN_NAME = 'status');
SET @sql = IF(@exists = 0,
  'ALTER TABLE Routes ADD COLUMN status ENUM(\'active\', \'completed\', \'cancelled\') NOT NULL DEFAULT \'active\' AFTER available',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE Routes ADD INDEX idx_routes_status (status);
ALTER TABLE Routes ADD INDEX idx_routes_source_destination (source, destination);
ALTER TABLE Routes ADD INDEX idx_routes_driver_id (driverId);
ALTER TABLE Bookings ADD INDEX idx_bookings_user_status_date (userId, status, travelDate);
ALTER TABLE Bookings ADD INDEX idx_bookings_driver_status_date (driverId, status, travelDate);
ALTER TABLE booking_status_histories ADD INDEX idx_booking_status_history_booking (bookingId);
ALTER TABLE Users ADD UNIQUE INDEX idx_users_email (email);
ALTER TABLE Drivers ADD UNIQUE INDEX idx_drivers_vehicle_reg (vehicleReg);
ALTER TABLE Drivers ADD UNIQUE INDEX idx_drivers_user_id (userId);

-- Phase 2: notifications table is created via Sequelize model
-- Indexes are defined in the model definition
