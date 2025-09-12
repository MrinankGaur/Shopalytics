require('dotenv').config();
require('./utils/bigint.util'); 

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const shopifyRoutes = require('./routes/shopify.routes');
const tenantRoutes = require('./routes/tenant.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS: allow HOST_URL or fallback for local dev
app.use(cors({
  origin: process.env.HOST_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// ✅ Routes
app.use('/api/shopify', shopifyRoutes.webhookRouter);
app.use('/api/auth', authRoutes);
app.use('/api/shopify', shopifyRoutes.router);
app.use('/api/tenants', tenantRoutes);

// ✅ Health check (no DB required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// ✅ Important: bind to 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
