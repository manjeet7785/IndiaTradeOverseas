const express = require('express');
const app = express();
const { connectDB } = require('./Database');
const authRoutes = require('./src/routes/authRoutes');
const leadRoutes = require('./src/routes/leadRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const dispatchRoutes = require('./src/routes/dispatchRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const securityRoutes = require('./src/routes/securityRoutes');
const quotationRoutes = require('./src/routes/quotationRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const dotenv = require('dotenv').config();
const aiLeadRoutes = require('./src/routes/aiLeadRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cors = require('cors');

app.use(cors());

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.warn('Warning: MONGO_URI is not set. The database connection may fail.');
}

connectDB();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);

app.use('/api/admin', adminRoutes);
// app.use('/api/ai-leads', aiLeadRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/v1/dispatches', dispatchRoutes);
app.use('/api/documents', documentRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/chat', chatRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
