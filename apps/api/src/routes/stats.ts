import { Router, Request, Response } from 'express';
import { prisma } from '@lughx/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Đếm tổng số user đã đăng nhập qua hệ thống từ Database
    const totalUsers = await prisma.user.count();

    // Trả về dữ liệu thống kê
    res.json({
      success: true,
      data: {
        totalBots: 1, // Hiện tại đang chạy 1 cụm LughxOmniBot  
        activeServers: 24, // Dữ liệu chờ ghép nối với Bot
        totalUsers: totalUsers > 0 ? totalUsers : 1,
        systemPing: Math.floor(Math.random() * 20) + 25, // Tạo ping ngẫu nhiên 25-45ms
      }
    });
  } catch (error) {
    console.error('[STATS_ERROR]', error);
    res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu thống kê' });
  }
});

export default router;