const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const apiLimiter = require('./middleware/rateLimiter');
const healthRoutes = require('./routes/healthRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRbacTestRoutes = require('./routes/adminRbacTestRoutes');
const memberRoutes = require('./routes/memberRoutes');
const { publicRouter: membershipApplicationPublicRoutes, adminRouter: membershipApplicationAdminRoutes } = require('./routes/membershipApplicationRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', apiLimiter);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Bakpura Welfare Server' });
});

app.use('/api/health', healthRoutes);
app.use('/api/membership-applications', membershipApplicationPublicRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/members', memberRoutes);
app.use('/api/admin/membership-applications', membershipApplicationAdminRoutes);
if (process.env.NODE_ENV === 'development') {
  app.use('/api/admin/rbac-test', adminRbacTestRoutes);
}
app.use(notFound);
app.use(errorHandler);

module.exports = app;
