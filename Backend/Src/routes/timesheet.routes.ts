import { Router } from 'express';
import { TimesheetController } from '../controllers/timesheet.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { rbac } from '../middlewares/rbac.middleware';

const router = Router();
router.use(authenticateToken);

/**
 * @swagger
 * /api/timesheets:
 *   post:
 *     summary: Create timesheet entry
 *     tags: [Timesheets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, date, hours]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               date: { type: string, format: date, example: 2025-10-25 }
 *               hours: { type: number, example: 8.5 }
 *               description: { type: string }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimesheetCreateResponse'
 */
router.post('/', TimesheetController.create);

/**
 * @swagger
 * /api/timesheets/{id}:
 *   patch:
 *     summary: Update timesheet (draft only)
 *     tags: [Timesheets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               date: { type: string, format: date }
 *               hours: { type: number }
 *               description: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimesheetCreateResponse'
 */
router.patch('/:id', TimesheetController.update);

/**
 * @swagger
 * /api/timesheets/{id}:
 *   delete:
 *     summary: Delete timesheet before submission
 *     tags: [Timesheets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimesheetDeleteResponse'
 */
router.delete('/:id', TimesheetController.delete);

/**
 * @swagger
 * /api/timesheets/{id}/submit:
 *   post:
 *     summary: Submit timesheet for approval
 *     tags: [Timesheets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimesheetMessageResponse'
 */
router.post('/:id/submit', TimesheetController.submit);

/**
 * @swagger
 * /api/timesheets/{id}/approve:
 *   post:
 *     summary: Approve timesheet
 *     tags: [Timesheets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimesheetMessageResponse'
 */
router.post('/:id/approve', rbac(['manager', 'admin']), TimesheetController.approve);

/**
 * @swagger
 * /api/timesheets/{id}/reject:
 *   post:
 *     summary: Reject timesheet
 *     tags: [Timesheets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimesheetMessageResponse'
 */
router.post('/:id/reject', rbac(['manager', 'admin']), TimesheetController.reject);

/**
 * @swagger
 * /api/timesheets:
 *   get:
 *     summary: Get all user timesheets
 *     tags: [Timesheets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimesheetListResponse'
 */
router.get('/', TimesheetController.listByUser);

export default router;
