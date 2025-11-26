import User from '../models/User.model';
import bcrypt from 'bcrypt';

export const seedDatabase = async () => {
  try {
    // 1. Seed Admin
    const adminExists = await User.findOne({ email: 'admin@synergy.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        name: 'System Admin',
        email: 'admin@synergy.com',
        password: hashedPassword,
        role: 'ADMIN'
      });
      console.log('🌱 Seeded: Admin User (admin@synergy.com / 123456)');
    }

    // 2. Seed Manager
    const managerExists = await User.findOne({ email: 'manager@synergy.com' });
    if (!managerExists) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        name: 'Mike Manager',
        email: 'manager@synergy.com',
        password: hashedPassword,
        role: 'MANAGER'
      });
      console.log('🌱 Seeded: Manager User (manager@synergy.com / 123456)');
    }

    const manager2Exists = await User.findOne({ email: 'manager2@synergy.com' });
    if (!manager2Exists) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        name: 'Mike Manager',
        email: 'manager2@synergy.com',
        password: hashedPassword,
        role: 'MANAGER'
      });
      console.log('🌱 Seeded: Manager User (manager2@synergy.com / 123456)');
    }


    // 3. Seed Employee (Optional)
    const employeeExists = await User.findOne({ email: 'employee@synergy.com' });
    if (!employeeExists) {
      // Find the manager to link
      const manager = await User.findOne({ email: 'manager@synergy.com' });
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await User.create({
        name: 'Emma Employee',
        email: 'employee@synergy.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        managerId: manager?._id // Auto-assign to Mike
      });
      console.log('🌱 Seeded: Employee User (employee@synergy.com / 123456)');
    }

  } catch (error) {
    console.error('❌ Seeding Failed:', error);
  }
};