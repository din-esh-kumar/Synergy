import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { LeaveAdminController } from '../controllers/leave-admin.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { rbac } from '../middlewares/rbac.middleware';

const router = Router();
router.use(authenticateToken);

/**
 * @swagger
 * /api/leaves:
 *   post:
 *     summary: Apply for leave
 *     tags: [Leaves]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leaveTypeId, startDate, endDate]
 *             properties:
 *               userId: { type: string, description: 'Required for admin/manager when creating for others' }
 *               leaveTypeId: { type: string, format: uuid, example: '123e4567-e89b-12d3-a456-426614174000' }
 *               startDate: { type: string, format: date, example: '2025-12-01' }
 *               endDate: { type: string, format: date, example: '2025-12-03' }
 *               reason: { type: string, example: 'Medical appointment' }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveCreateResponse'
 */
router.post('/', rbac(['admin', 'manager', 'employee']), LeaveController.apply);

/**
 * @swagger
 * /api/leaves/{id}:
 *   patch:
 *     summary: Update leave (draft only)
 *     tags: [Leaves]
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
 *               leaveTypeId: { type: string, format: uuid }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveCreateResponse'
 */
router.patch('/:id', rbac(['admin', 'manager', 'employee']), LeaveController.update);

/**
 * @swagger
 * /api/leaves/{id}:
 *   delete:
 *     summary: Delete leave before submission
 *     tags: [Leaves]
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
 *               $ref: '#/components/schemas/LeaveDeleteResponse'
 */
router.delete('/:id', rbac(['admin', 'manager', 'employee']), LeaveController.delete);

/**
 * @swagger
 * /api/leaves/{id}/submit:
 *   post:
 *     summary: Submit leave for approval
 *     tags: [Leaves]
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
 *               $ref: '#/components/schemas/LeaveMessageResponse'
 */
router.post('/:id/submit', rbac(['admin', 'manager', 'employee']), LeaveController.submit);

/**
 * @swagger
 * /api/leaves/{id}/approve:
 *   post:
 *     summary: Approve leave
 *     tags: [Leaves]
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
 *               $ref: '#/components/schemas/LeaveMessageResponse'
 */
router.post('/:id/approve', rbac(['manager', 'admin']), LeaveController.approve);

/**
 * @swagger
 * /api/leaves/{id}/reject:
 *   post:
 *     summary: Reject leave
 *     tags: [Leaves]
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
 *               reason: { type: string, example: 'Insufficient documentation' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveMessageResponse'
 */
router.post('/:id/reject', rbac(['manager', 'admin']), LeaveController.reject);

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: Get all user leaves
 *     tags: [Leaves]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, draft, submitted, approved, rejected]
 *         description: 'Filter by status (admin/manager can use "all" to see all leaves)'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveListResponse'
 */
router.get('/', rbac(['admin', 'manager', 'employee']), LeaveController.listByUser);

/**
 * @swagger
 * /api/leaves/types:
 *   get:
 *     summary: Get all active leave types
 *     tags: [Leaves]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: 
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveType'
 */
router.get('/types', rbac(['admin', 'manager', 'employee']), LeaveController.getLeaveTypes);

/**
 * @swagger
 * /api/leaves/balances:
 *   get:
 *     summary: Get user leave balances
 *     tags: [Leaves]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: 'Year for balance (defaults to current year)'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: 
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveBalance'
 */
router.get('/balances', rbac(['admin', 'manager', 'employee']), LeaveController.getLeaveBalances);

/**
 * @swagger
 * /api/leaves/working-days:
 *   get:
 *     summary: Calculate working days between two dates
 *     tags: [Leaves]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: '2024-12-01'
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: '2024-12-05'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     workingDays: { type: integer, example: 3 }
 */
router.get('/working-days', rbac(['admin', 'manager', 'employee']), LeaveController.calculateWorkingDays);

// ==================== ADMIN MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/leaves/admin/leave-types:
 *   get:
 *     summary: Get all leave types (admin only)
 *     tags: [Leaves-Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: 
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveType'
 */
router.get('/admin/leave-types', rbac(['admin']), LeaveAdminController.getLeaveTypes);

/**
 * @swagger
 * /api/leaves/admin/leave-types:
 *   post:
 *     summary: Create new leave type (admin only)
 *     tags: [Leaves-Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name: { type: string, example: 'Sick Leave' }
 *               code: { type: string, example: 'sick' }
 *               description: { type: string, example: 'Leave for health reasons' }
 *               maxDays: { type: integer, example: 12 }
 *               isActive: { type: boolean, example: true }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveType'
 */
router.post('/admin/leave-types', rbac(['admin']), LeaveAdminController.createLeaveType);

/**
 * @swagger
 * /api/leaves/admin/leave-types/{id}:
 *   patch:
 *     summary: Update leave type (admin only)
 *     tags: [Leaves-Admin]
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
 *               name: { type: string }
 *               description: { type: string }
 *               maxDays: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveType'
 */
router.patch('/admin/leave-types/:id', rbac(['admin']), LeaveAdminController.updateLeaveType);

/**
 * @swagger
 * /api/leaves/admin/holidays:
 *   get:
 *     summary: Get all holidays (admin only)
 *     tags: [Leaves-Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: 'Filter holidays by year'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: 
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Holiday'
 */
router.get('/admin/holidays', rbac(['admin']), LeaveAdminController.getHolidays);

/**
 * @swagger
 * /api/leaves/admin/holidays:
 *   post:
 *     summary: Create new holiday (admin only)
 *     tags: [Leaves-Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, date]
 *             properties:
 *               name: { type: string, example: 'Christmas Day' }
 *               date: { type: string, format: date, example: '2024-12-25' }
 *               description: { type: string, example: 'Christmas holiday' }
 *               isRecurring: { type: boolean, example: true }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Holiday'
 */
router.post('/admin/holidays', rbac(['admin']), LeaveAdminController.createHoliday);

/**
 * @swagger
 * /api/leaves/admin/holidays/{id}:
 *   patch:
 *     summary: Update holiday (admin only)
 *     tags: [Leaves-Admin]
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
 *               name: { type: string }
 *               date: { type: string, format: date }
 *               description: { type: string }
 *               isRecurring: { type: boolean }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Holiday'
 */
router.patch('/admin/holidays/:id', rbac(['admin']), LeaveAdminController.updateHoliday);

/**
 * @swagger
 * /api/leaves/admin/holidays/{id}:
 *   delete:
 *     summary: Delete holiday (admin only)
 *     tags: [Leaves-Admin]
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
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 */
router.delete('/admin/holidays/:id', rbac(['admin']), LeaveAdminController.deleteHoliday);

/**
 * @swagger
 * /api/leaves/admin/leave-balances:
 *   get:
 *     summary: Get user leave balances (admin only)
 *     tags: [Leaves-Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 'User ID (defaults to current user if not provided)'
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: 'Year for balance (defaults to current year)'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: 
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaveBalance'
 */
router.get('/admin/leave-balances', rbac(['admin']), LeaveAdminController.getUserLeaveBalances);

/**
 * @swagger
 * /api/leaves/admin/leave-balances:
 *   post:
 *     summary: Update user leave balance (admin only)
 *     tags: [Leaves-Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, leaveTypeId, balance]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               leaveTypeId: { type: string, format: uuid }
 *               balance: { type: integer, example: 15 }
 *               year: { type: integer, example: 2024 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveBalance'
 */
router.post('/admin/leave-balances', rbac(['admin']), LeaveAdminController.updateUserLeaveBalance);


// Add to leave.routes.ts - after the existing admin routes

/**
 * @swagger
 * /api/leaves/admin/initialize-user-balances:
 *   post:
 *     summary: Initialize default leave balances for a specific user
 *     tags: [Leaves-Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: 
 *                 type: string 
 *                 format: uuid
 *                 example: '123e4567-e89b-12d3-a456-426614174000'
 *               year: 
 *                 type: integer 
 *                 example: 2024
 *     responses:
 *       200:
 *         description: Leave balances initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Leave balances initialized: 3 created, 2 already existed'
 *                 data:
 *                   type: object
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 */
router.post('/admin/initialize-user-balances', rbac(['admin']), LeaveAdminController.initializeUserLeaveBalances);

/**
 * @swagger
 * /api/leaves/admin/initialize-all-balances:
 *   post:
 *     summary: Initialize default leave balances for all active users
 *     tags: [Leaves-Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year: 
 *                 type: integer 
 *                 example: 2024
 *     responses:
 *       200:
 *         description: Leave balances initialized for all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Leave balances initialized for 5 users: 15 new balances created, 10 already existed'
 *                 data:
 *                   type: object
 */
router.post('/admin/initialize-all-balances', rbac(['admin']), LeaveAdminController.initializeAllUsersLeaveBalances);

export default router;