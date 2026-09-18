import { Router, Request, Response } from 'express';
import { prisma } from '@lughx/database';

const router = Router();

// 1. Lấy danh sách toàn bộ server
router.get('/', async (req: Request, res: Response) => {
  try {
    const botRes = await fetch('http://localhost:5001/internal/servers');
    if (!botRes.ok) throw new Error('Bot offline');
    const servers = await botRes.json();
    res.json({ success: true, data: servers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi kết nối tới Bot' });
  }
});

// 2. Lấy chi tiết 1 server + Cấu hình trong DB
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const guildId = req.params.id;
    
    // Tạo config mặc định nếu server chưa từng được cài đặt
    const config = await prisma.guildConfig.upsert({
      where: { guildId },
      update: {},
      create: { guildId }
    });
    
    // Lấy danh sách kênh từ Bot
    const botRes = await fetch(`http://localhost:5001/internal/servers/${guildId}`);
    const serverData = botRes.ok ? await botRes.json() : null;

    res.json({ success: true, config, serverData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải cấu hình' });
  }
});

// 3. Lưu cấu hình khi người dùng bấm Save
router.post('/:id', async (req: Request, res: Response) => {
  try {
    const guildId = req.params.id;
    const { prefix, welcomeChannelId, musicEnabled, modEnabled } = req.body;

    const updated = await prisma.guildConfig.upsert({
      where: { guildId },
      update: { prefix, welcomeChannelId, musicEnabled, modEnabled },
      create: { guildId, prefix, welcomeChannelId, musicEnabled, modEnabled }
    });

    res.json({ success: true, data: updated, message: 'Đã lưu cài đặt!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lưu cấu hình' });
  }
});

export default router;