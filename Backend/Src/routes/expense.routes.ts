import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { rbac } from '../middlewares/rbac.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();
router.use(authenticateToken);

// create
router.post(
  '/',
  rbac(['admin', 'manager', 'employee']),
  upload.single('receipt'),
  ExpenseController.create
);

// update
router.patch(
  '/:id',
  rbac(['admin', 'manager', 'employee']),
  upload.single('receipt'),
  ExpenseController.update
);

// list
router.get(
  '/',
  rbac(['admin', 'manager', 'employee']),
  ExpenseController.listByUser
);

// submit / approve / reject stay the same, using rbac(...)

// upload receipt
router.post(
  '/:id/receipt',
  rbac(['admin', 'manager', 'employee']),
  upload.single('receipt'),
  ExpenseController.uploadReceipt
);

// download receipt
router.get(
  '/:id/receipt',
  rbac(['admin', 'manager', 'employee']),
  ExpenseController.downloadReceipt
);

export default router;
