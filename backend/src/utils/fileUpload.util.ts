import multer from 'multer';

/**
 * Multer configuration for MongoDB storage
 * Files kept in memory as req.file.buffer for controllers to save to MongoDB
 */

// File filter (unchanged)
const fileFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const allowedTypes = [
    'application/pdf', 
    'text/plain', 
    'image/png', 
    'image/jpeg', 
    'image/jpg', 
    'image/gif', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

// Memory storage - NO DISK WRITES
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export default upload;
