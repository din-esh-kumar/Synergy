import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const timesheetSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  date: Joi.date().required(),
  hours: Joi.number().min(0).max(24).required(),
  description: Joi.string().allow('').max(500),
});

export const expenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().allow('').max(500),
  receiptUrl: Joi.string().uri().optional(),
});

export const leaveSchema = Joi.object({
  type: Joi.string().valid('sick', 'casual', 'earned', 'maternity', 'paternity').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  reason: Joi.string().allow('').max(1000),
});
