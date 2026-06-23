const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/database');
const { seedRoles } = require('./src/modules/users/roles/permission.service');

const PORT = env.PORT;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server boot failed:', error.message);
    process.exit(1);
  }
}

startServer();
