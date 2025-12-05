import { Router } from 'express';
import { uploadMiddleware } from '../config/multerConfig';
import {
  uploadDocument,
  getProjectDocuments,
  deleteDocument,
  downloadDocument,
} from '../controllers/document.controller';

const router = Router();

router.post('/upload', uploadMiddleware.single('file'), uploadDocument);
router.get('/project/:projectId', getProjectDocuments);
router.delete('/:documentId', deleteDocument);
router.get('/download/:documentId', downloadDocument);

export default router;
