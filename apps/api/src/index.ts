import { config } from 'dotenv';
import { join } from 'path';

// Bắt buộc nạp dotenv đầu tiên trước khi import bất kỳ router hay module nào
config({ path: join(__dirname, '../../../.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { prisma } from '@lughx/database';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

// Cho phép credentials (cookie) từ cả IP VPS lẫn localhost
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://160.191.237.229:3000',
  'http://160.191.237.229:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (như mobile app, curl, server-to-server) hoặc nằm trong danh sách
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Trong môi trường dev/IP có thể cho qua để tránh lỗi block CORS
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Định tuyến xác thực
app.use('/api/auth', authRoutes);

// Kiểm tra trạng thái hệ thống
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'Connected', message: 'Lughx API is running' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'Disconnected' });
  }
});

app.listen(PORT, () => {
  console.log(`[API] Máy chủ Backend đang chạy tại: http://localhost:${PORT}`);
});