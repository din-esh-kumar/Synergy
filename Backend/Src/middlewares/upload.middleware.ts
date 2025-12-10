// import multer from 'multer';

// const storage = multer.memoryStorage();

// export const upload = multer({
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // Max 5MB file size
//   },
//   fileFilter(req, file, cb) {
//     if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
//       return cb(new Error('Only images and PDFs are allowed'));
//     }
//     cb(null, true);
//   },
// });




// src/middleware/upload.middleware.ts
import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only image and PDF files are allowed'));
    }
    cb(null, true);
  },
});


