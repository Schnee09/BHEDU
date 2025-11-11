// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import lessonRoutes from './routes/lessonRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
// internalRoutes is TS-recognized; add explicit extension for strict moduleResolution edge cases
import internalRoutes from './routes/internalRoutes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Public health check
app.get('/health', (_req, res) => res.status(200).json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  service: 'bh-edu-backend' 
}));

// Auth routes (Bearer token based)
app.use('/api/auth', authRoutes);

// User/resource routes (Bearer token auth)
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Internal HMAC-protected routes for server-to-server
app.use('/api/internal', internalRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
