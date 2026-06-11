const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv').config();

const User = require('./src/models/User');
const { connectDB } = require('./Database');

async function seed() {
  try {
    await connectDB();

    const usersToSeed = [
      {
        employeeId: 'EMP001',
        fullName: 'System Admin',
        email: 'admin@itoexim.com',
        phone: '1234567890',
        password: 'admin123',
        role: 'ADMIN',
        department: 'ADMIN'
      },
      {
        employeeId: 'EMP002',
        fullName: 'Sales Associate',
        email: 'sales@itoexim.com',
        phone: '0987654321',
        password: 'sales123',
        role: 'SALES',
        department: 'SALES'
      }
    ];

    for (const item of usersToSeed) {
      let user = await User.findOne({ email: item.email });
      const passwordHash = await bcrypt.hash(item.password, 10);

      if (!user) {
        user = await User.create({
          employeeId: item.employeeId,
          fullName: item.fullName,
          email: item.email,
          phone: item.phone,
          passwordHash,
          role: item.role,
          department: item.department,
          isActive: true
        });
        console.log(`Created user: ${item.email}`);
      } else {
        user.passwordHash = passwordHash;
        user.isActive = true;
        await user.save();
        console.log(`Updated user password & active state: ${item.email}`);
      }
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
