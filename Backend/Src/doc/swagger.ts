import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Timesheet, Expense & Leave Management API',
      version: '1.0.0',
      description: 'Complete API for employee timesheet tracking, expense claims, leave management, and approvals',
      contact: {
        name: 'API Support',
        email: 'support@company.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:8001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // =============== BASE RESPONSES ===============
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'An error occurred' }
          }
        },

        // =============== USER ===============
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            email: { type: 'string', format: 'email', example: 'john.doe@company.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', enum: ['employee', 'manager', 'admin'], example: 'employee' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time', example: '2025-10-25T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-10-25T12:00:00.000Z' }
          }
        },
        UserProfileResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/User' }
          }
        },

        // =============== AUTH ===============
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoiam9obi5kb2VAY29tcGFueS5jb20iLCJyb2xlIjoiZW1wbG95ZWUiLCJpYXQiOjE3MzAwMDAwMDB9.abc123' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoiam9obi5kb2VAY29tcGFueS5jb20iLCJyb2xlIjoiZW1wbG95ZWUiLCJpYXQiOjE3MzAwMDAwMDB9.xyz789' }
              }
            }
          }
        },
        RefreshTokenResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
              }
            }
          }
        },

        // =============== EXPENSE ===============
        Expense: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '770e8400-e29b-41d4-a716-446655440002' },
            userId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            amount: { type: 'string', example: '199.99' },
            description: { type: 'string', example: 'Flight ticket reimbursement for client meeting' },
            receiptUrl: { type: 'string', example: '507f1f77bcf86cd799439011' },
            status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'], example: 'draft' },
            submittedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
            approvedBy: { type: 'string', format: 'uuid', nullable: true, example: null },
            approvedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
            rejectionReason: { type: 'string', nullable: true, example: null },
            createdAt: { type: 'string', format: 'date-time', example: '2025-10-25T14:30:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-10-25T14:30:00.000Z' }
          }
        },
        ExpenseCreateResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Expense' } }
          }
        },
        ExpenseListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Expense' } }
          }
        },
        ExpenseMessageResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Expense submitted' },
            data: { type: 'array', items: { $ref: '#/components/schemas/Expense' } }
          }
        },
        ExpenseDeleteResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Expense deleted successfully' }
          }
        },

        // =============== TIMESHEET ===============
        Timesheet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '660e8400-e29b-41d4-a716-446655440001' },
            userId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            projectId: { type: 'string', format: 'uuid', example: '990e8400-e29b-41d4-a716-446655440004' },
            date: { type: 'string', format: 'date', example: '2025-10-25' },
            hours: { type: 'string', example: '8.5' },
            description: { type: 'string', example: 'Worked on authentication and authorization module' },
            status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'], example: 'draft' },
            submittedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
            approvedBy: { type: 'string', format: 'uuid', nullable: true, example: null },
            approvedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
            rejectionReason: { type: 'string', nullable: true, example: null },
            createdAt: { type: 'string', format: 'date-time', example: '2025-10-25T09:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-10-25T09:00:00.000Z' }
          }
        },
        TimesheetCreateResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Timesheet' } }
          }
        },
        TimesheetListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Timesheet' } }
          }
        },
        TimesheetMessageResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Timesheet submitted for approval' },
            data: { type: 'array', items: { $ref: '#/components/schemas/Timesheet' } }
          }
        },
        TimesheetDeleteResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Timesheet deleted successfully' }
          }
        },

        // =============== LEAVE ===============
        Leave: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '880e8400-e29b-41d4-a716-446655440003' },
            userId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            leaveTypeId: { type: 'string', format: 'uuid', example: 'aa0e8400-e29b-41d4-a716-446655440005' },
            startDate: { type: 'string', format: 'date', example: '2025-12-01' },
            endDate: { type: 'string', format: 'date', example: '2025-12-03' },
            reason: { type: 'string', example: 'Medical appointment and recovery' },
            status: { type: 'string', enum: ['draft', 'pending', 'submitted', 'approved', 'rejected'], example: 'draft' },
            appliedAt: { type: 'string', format: 'date-time', nullable: true, example: '2025-10-25T10:00:00.000Z' },
            approvedBy: { type: 'string', format: 'uuid', nullable: true, example: null },
            approvedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
            rejectionReason: { type: 'string', nullable: true, example: null },
            createdAt: { type: 'string', format: 'date-time', example: '2025-10-25T10:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-10-25T10:00:00.000Z' }
          }
        },
        LeaveCreateResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Leave' } }
          }
        },
        LeaveListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Leave' } }
          }
        },
        LeaveMessageResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Leave approved' },
            data: { type: 'array', items: { $ref: '#/components/schemas/Leave' } }
          }
        },
        LeaveDeleteResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Leave deleted successfully' }
          }
        },

        // =============== PROJECT ===============
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '990e8400-e29b-41d4-a716-446655440004' },
            name: { type: 'string', example: 'Website Redesign' },
            description: { type: 'string', nullable: true, example: 'Complete overhaul of company website with modern UI/UX' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-10-20T08:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-10-20T08:00:00.000Z' }
          }
        },
        ProjectCreateResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Project' } }
          }
        },
        ProjectListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Project' } }
          }
        },
        ProjectSingleResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/Project' }
          }
        },
        ProjectDeleteResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Project deleted successfully' }
          }
        },

        // =============== APPROVAL ===============
        PendingItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['timesheet', 'expense', 'leave'] },
            userId: { type: 'string', format: 'uuid' },
            status: { type: 'string', example: 'submitted' },
            submittedAt: { type: 'string', format: 'date-time' },
            amount: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true }
          }
        },
        ApprovalListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                timesheets: { type: 'array', items: { $ref: '#/components/schemas/Timesheet' } },
                expenses: { type: 'array', items: { $ref: '#/components/schemas/Expense' } },
                leaves: { type: 'array', items: { $ref: '#/components/schemas/Leave' } }
              }
            }
          }
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
});
