import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Gọi sang cổng nội bộ 5001 của tiến trình lughx-bot
    const botRes = await fetch('http://localhost:5001/internal/servers');
    if (!botRes.ok) throw new Error('Lỗi kết nối tới Bot');
    
    const servers = await botRes.json();
    res.json({ success: true, data: servers });
  } catch (error) {
    console.error('[SERVERS_ERROR]', error);
    res.status(500).json({ success: false, message: 'Bot đang offline hoặc lỗi kết nối' });
  }
});

export default router;