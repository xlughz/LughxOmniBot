import { Router, Request, Response } from 'express';

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

// Lấy thông tin chi tiết 1 server theo Guild ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const botRes = await fetch(`http://localhost:5001/internal/servers/${id}`);
    if (!botRes.ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy máy chủ' });
    }
    const serverDetails = await botRes.json();

    // Khớp chuẩn cả serverData lẫn data cho ServerSettings.tsx
res.json({ 
      success: true, 
      data: serverDetails,
      serverData: serverDetails,
      config: {
        prefix: '!l',
        welcomeChannelId: '',
        musicEnabled: false,
        modEnabled: true
      }
    });
  } catch (error) {
    console.error('[SERVER_DETAIL_ERROR]', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin máy chủ' });
  }
});

// Xử lý lưu cấu hình
router.post('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newConfig = req.body;
    console.log(`[CONFIG_SAVE] Máy chủ ${id}:`, newConfig);
    res.json({ success: true, message: 'Cập nhật cấu hình thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lưu cấu hình' });
  }
});

export default router;