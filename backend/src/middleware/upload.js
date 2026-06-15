const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { minioClient, BUCKET_NAME } = require('../config/minio');

const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF are supported.'), false);
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB limit
}).fields([
  { name: 'licenseDoc', maxCount: 1 },
  { name: 'vehicleRc', maxCount: 1 },
]);

const handleUploads = (req, res, next) => {
  multerUpload(req, res, async (err) => {
    if (err) {
      let errMsg = err.message;
      if (err.code === 'LIMIT_FILE_SIZE') {
        errMsg = 'File size limit exceeded. Max size allowed is 4 MB.';
      }
      return res.status(400).json({ message: errMsg });
    }

    // If it's a driver registration, files are mandatory
    if (req.body.role === 'driver') {
      if (!req.files || !req.files.licenseDoc || !req.files.vehicleRc) {
        return res.status(400).json({ message: 'Both Driving License and Vehicle RC documents are required.' });
      }
    } else {
      // Non-driver role: proceed without document upload
      return next();
    }

    try {
      const licenseFile = req.files.licenseDoc[0];
      const rcFile = req.files.vehicleRc[0];

      // Validate extensions for extra security
      const licenseExt = path.extname(licenseFile.originalname).toLowerCase();
      const rcExt = path.extname(rcFile.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];

      if (!allowedExts.includes(licenseExt) || !allowedExts.includes(rcExt)) {
        return res.status(400).json({ message: 'Invalid file extension. Only JPG, JPEG, PNG, and PDF are allowed.' });
      }

      const uniqueId = crypto.randomBytes(8).toString('hex');
      const timestamp = Date.now();

      const licenseFilename = `driver-license/${timestamp}-${uniqueId}${licenseExt}`;
      const rcFilename = `rc/${timestamp}-${uniqueId}${rcExt}`;

      // Upload licenseDoc to MinIO
      await minioClient.putObject(
        BUCKET_NAME,
        licenseFilename,
        licenseFile.buffer,
        licenseFile.size,
        { 'Content-Type': licenseFile.mimetype }
      );

      // Upload vehicleRc to MinIO
      await minioClient.putObject(
        BUCKET_NAME,
        rcFilename,
        rcFile.buffer,
        rcFile.size,
        { 'Content-Type': rcFile.mimetype }
      );

      // Build the public URLs using localhost:9000 (MinIO API endpoint)
      const port = process.env.MINIO_PORT || '9000';
      const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';

      req.licenseDocUrl = `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${licenseFilename}`;
      req.vehicleRcUrl = `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${rcFilename}`;

      next();
    } catch (uploadError) {
      console.error('MinIO Upload Error:', uploadError);
      return res.status(500).json({ message: 'Failed to upload documents to storage.' });
    }
  });
};

module.exports = {
  handleUploads,
};
