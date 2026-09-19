import { Router, Request, Response } from 'express';
import { prisma } from '@lughx/database';

const router = Router();

// 1. Lấy danh sách toàn bộ server từ Bot nội bộ (port 5001)
router.get('/', async (req: Request, res: Response) => {
  try {
    const botRes = await fetch('http://localhost:5001/internal/servers');
    if (!botRes.ok) {
      return res.status(502).json({ success: false, message: 'Bot không phản hồi' });
    }
    const servers = await botRes.json();
    res.json({ success: true, data: servers, servers });
  } catch (error) {
    console.error('[API_SERVERS_ERROR]', error);
    res.status(500).json({ success: false, message: 'Lỗi kết nối bot nội bộ' });
  }
});

// 2. Lấy thông tin chi tiết một server kèm cấu hình từ Database
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const botRes = await fetch(`http://localhost:5001/internal/servers/${id}`);
    if (!botRes.ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy máy chủ' });
    }
    const serverDetails = await botRes.json();

    // Truy vấn cấu hình từ Prisma DB
    const config = await prisma.guildConfig.findUnique({ 
      where: { guildId: id } 
    });

    // Cấu hình mặc định an toàn nếu server chưa từng được cấu hình trước đó
    const safeConfig = config || {
      prefix: '!l',
      welcomeChannelId: '',
      welcomeMessage: '',
      goodbyeChannelId: '',
      goodbyeMessage: '',
      musicEnabled: true,
      modEnabled: true,
    };

    res.json({
      success: true,
      data: serverDetails,
      serverData: serverDetails,
      config: {
        prefix: safeConfig.prefix,
        welcomeChannelId: safeConfig.welcomeChannelId || '',
        welcomeMessage: (safeConfig as any).welcomeMessage || '',
        goodbyeChannelId: (safeConfig as any).goodbyeChannelId || '',
        goodbyeMessage: (safeConfig as any).goodbyeMessage || '',
        musicEnabled: safeConfig.musicEnabled,
        modEnabled: safeConfig.modEnabled
      }
    });
  } catch (error) {
    console.error('[API_SERVER_DETAIL_ERROR]', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin máy chủ' });
  }
});

// 3. Lưu hoặc cập nhật cấu hình server từ Web Dashboard
router.post('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      prefix, 
      welcomeChannelId, 
      welcomeMessage, 
      goodbyeChannelId, 
      goodbyeMessage, 
      musicEnabled, 
      modEnabled 
    } = req.body;

    const savedConfig = await prisma.guildConfig.upsert({
      where: { guildId: id },
      update: {
        prefix: prefix || '!l',
        welcomeChannelId: welcomeChannelId || null,
        welcomeMessage: welcomeMessage || null,
        goodbyeChannelId: goodbyeChannelId || null,
        goodbyeMessage: goodbyeMessage || null,
        musicEnabled: Boolean(musicEnabled),
        modEnabled: Boolean(modEnabled)
      },
      create: {
        guildId: id,
        prefix: prefix || '!l',
        welcomeChannelId: welcomeChannelId || null,
        welcomeMessage: welcomeMessage || null,
        goodbyeChannelId: goodbyeChannelId || null,
        goodbyeMessage: goodbyeMessage || null,
        musicEnabled: Boolean(musicEnabled),
        modEnabled: Boolean(modEnabled)
      }
    });

    console.log(`[API] Đã cập nhật cấu hình cho Guild: ${id}`);
    res.json({ success: true, message: 'Đã lưu cấu hình thành công', config: savedConfig });
  } catch (error) {
    console.error('[API_CONFIG_SAVE_ERROR]', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu cấu hình vào cơ sở dữ liệu' });
  }
});

export default router;