import { Router, Request, Response } from 'express';
import { prisma } from '@lughx/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Đếm tổng số user từ Database
    const totalUsers = await prisma.user.count().catch(() => 0);

    // Lấy thông số Realtime từ Bot (qua cổng nội bộ 5001)
    let botStats: any = {};
    
    try {
      const botRes = await fetch('http://localhost:5001/internal/stats');
      if (botRes.ok) {
        botStats = await botRes.json();
      }
    } catch (botError) {
      console.warn('[API] Bot hiện đang offline hoặc chưa mở cổng nội bộ 5001');
    }

    // Trả về dữ liệu tổng hợp: giữ nguyên các trường cũ và gộp toàn bộ botStats mới
    res.json({
      success: true,
      data: {
        totalBots: 1,
        activeServers: 0,
        systemPing: 0,
        totalUsers,
        ...botStats, // Gộp toàn bộ uptime, botMemoryMB, systemMemory, cpu, v.v.
      }
    });
  } catch (error) {
    console.error('[STATS_ERROR]', error);
    res.status(500).json({ success: false, message: 'Không thể lấy dữ liệu thống kê' });
  }
});

export default router;