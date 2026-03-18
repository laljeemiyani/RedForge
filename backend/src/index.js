require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const auditRoutes = require('./routes/audits');
const billingRoutes = require('./routes/billing');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: "ok", service: "RedForge API" });
});

app.use('/api/auth', authRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/billing', billingRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
