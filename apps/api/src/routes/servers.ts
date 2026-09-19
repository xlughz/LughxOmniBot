import { Router, Request, Response } from 'express';
import { prisma } from '@lughx/database';

const router = Router();

// Lấy danh sách toàn bộ server mà Bot đang tham gia
router.get('/', async (req: Request, res: Response) => {
  try {
    const botRes = await fetch('http://localhost:5001/internal/servers');
    if (!botRes.ok) {
      return res.status(502).json({ success: false, message: 'Bot nội bộ không phản hồi' });
    }
    const servers = await botRes.json();
    res.json({ success: true, data: servers, servers });
  } catch (error) {
    console.error('[SERVERS_ERROR]', error);
    res.status(500).json({ success: false, message: 'Không thể kết nối đến Bot nội bộ' });
  }
});

// Lấy thông tin chi tiết 1 server và cấu hình đã lưu trong DB
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const botRes = await fetch(`http://localhost:5001/internal/servers/${id}`);
    if (!botRes.ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy máy chủ' });
    }
    const serverDetails = await botRes.json();

    let config = await prisma.guildConfig.findUnique({
      where: { guildId: id }
    });

    if (!config) {
      config = {
        id: '',
        guildId: id,
        prefix: '!l',
        welcomeChannelId: '',
        musicEnabled: true,
        modEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    res.json({
      success: true,
      data: serverDetails,
      serverData: serverDetails,
      config: {
        prefix: config.prefix,
        welcomeChannelId: config.welcomeChannelId || '',
        musicEnabled: config.musicEnabled,
        modEnabled: config.modEnabled
      }
    });
  } catch (error) {
    console.error('[SERVER_DETAIL_ERROR]', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin máy chủ' });
  }
});

// Lưu cấu hình vào Database qua Prisma upsert từ Dashboard
router.post('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { prefix, welcomeChannelId, musicEnabled, modEnabled } = req.body;

    const savedConfig = await prisma.guildConfig.upsert({
      where: { guildId: id },
      update: {
        prefix: prefix || '!l',
        welcomeChannelId: welcomeChannelId || null,
        musicEnabled: Boolean(musicEnabled),
        modEnabled: Boolean(modEnabled)
      },
      create: {
        guildId: id,
        prefix: prefix || '!l',
        welcomeChannelId: welcomeChannelId || null,
        musicEnabled: Boolean(musicEnabled),
        modEnabled: Boolean(modEnabled)
      }
    });

    console.log(`[DATABASE] Đã lưu cấu hình Guild ${id}:`, savedConfig);
    res.json({ success: true, message: 'Đã lưu cấu hình thành công', config: savedConfig });
  } catch (error) {
    console.error('[CONFIG_SAVE_ERROR]', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu cấu hình vào cơ sở dữ liệu' });
  }
});

export default router;