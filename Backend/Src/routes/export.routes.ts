import { Router } from 'express';
import ExportController from '../controllers/export.controller';
import  {authenticateToken}  from '../middlewares/auth.middleware'; // your auth middleware

const router = Router();

// Protect all export routes with auth middleware
router.use(authenticateToken);

/**
 * @swagger
 * /api/export/timesheets:
 *   get:
 *     summary: Export timesheets with filters
 *     tags: [Export]
 *     parameters:
 *       - name: userId
 *         in: query
 *         type: string
 *       - name: projectId
 *         in: query
 *         type: string
 *       - name: status
 *         in: query
 *         type: string
 *       - name: startDate
 *         in: query
 *         type: string
 *       - name: endDate
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Timesheets data for export
 */
router.get('/timesheets', ExportController.exportTimesheets);

/**
 * @swagger
 * /api/export/expenses:
 *   get:
 *     summary: Export expenses with filters
 *     tags: [Export]
 *     parameters:
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Expenses data for export
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/expenses', ExportController.exportExpenses);

/**
 * @swagger
 * /api/export/leaves:
 *   get:
 *     summary: Export leaves with filters
 *     tags: [Export]
 *     parameters:
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Leaves data for export
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/leaves', ExportController.exportLeaves);

export default router;

