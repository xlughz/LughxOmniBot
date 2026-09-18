import { Router, Request, Response } from 'express';
import { prisma } from '@lughx/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Đếm tổng số user từ Database
    const totalUsers = await prisma.user.count();

    // Lấy thông số Realtime từ Bot (qua cổng nội bộ 5001)
    let botStats = { activeServers: 0, systemPing: 0, totalBots: 0 };
    
    try {
      const botRes = await fetch('http://localhost:5001/internal/stats');
      if (botRes.ok) {
        botStats = await botRes.json();
      }
    } catch (botError) {
      console.warn('[API] Bot hiện đang offline hoặc chưa mở cổng nội bộ 5001');
    }

    // Trả về dữ liệu tổng hợp cho Frontend
    res.json({
      success: true,
      data: {
        totalBots: botStats.totalBots || 1, // Mặc định là 1 nếu lỗi
        activeServers: botStats.activeServers || 0,
        totalUsers: totalUsers > 0 ? totalUsers : 0,
        systemPing: botStats.systemPing || 0,
      }
    });
  } catch (error) {
    console.error('[STATS_ERROR]', error);
    res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu thống kê' });
  }
});

export default router;