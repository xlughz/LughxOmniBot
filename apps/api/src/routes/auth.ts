import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '@lughx/database';

const router = Router();

// Lấy biến môi trường động trong từng request để tránh lỗi nạp biến trễ
const getEnv = () => ({
  CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://160.191.237.229:5000/api/auth/callback',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://160.191.237.229:3000',
});

// 1. Chuyển hướng người dùng sang trang ủy quyền của Discord
router.get('/discord', (req: Request, res: Response) => {
  const { CLIENT_ID, REDIRECT_URI } = getEnv();

  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify%20guilds`;
  
  res.redirect(url);
});

// 2. Xử lý Callback từ Discord gửi về
router.get('/callback', async (req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FRONTEND_URL } = getEnv();
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/?error=NO_CODE`);
  }

  try {
    // 2.1 Đổi mã (code) lấy Access Token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code.toString(),
        redirect_uri: REDIRECT_URI,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error('OAuth Token exchange failed');

    // 2.2 Dùng Token lấy thông tin User từ Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const discordUser = await userResponse.json();

    // 2.3 Lưu hoặc cập nhật User trong Database SQLite
    const user = await prisma.user.upsert({
      where: { discordId: discordUser.id },
      update: {
        username: discordUser.username,
        avatar: discordUser.avatar,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      create: {
        discordId: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
    });

    // 2.4 Tạo Session bảo mật (thời hạn 7 ngày)
    const sessionId = crypto.randomBytes(32).toString('hex');
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 2.5 Cài đặt Cookie vào trình duyệt
    // Lưu ý: secure PHẢI là false khi chạy qua HTTP thường (IP VPS không có SSL)
    res.cookie('lughx_session', sessionId, {
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('[AUTH_ERROR]', error);
    res.redirect(`${FRONTEND_URL}/?error=OAUTH_FAILED`);
  }
});

// 3. Lấy thông tin người dùng hiện tại theo Cookie
router.get('/me', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.lughx_session;

  if (!sessionId) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ success: false, message: 'Phiên đã hết hạn' });
  }

  return res.json({ success: true, user: session.user });
});

// 4. Đăng xuất và xóa Session
router.post('/logout', async (req: Request, res: Response) => {
  const { FRONTEND_URL } = getEnv();
  const sessionId = req.cookies?.lughx_session;

  if (sessionId) {
    await prisma.session.deleteMany({
      where: { id: sessionId },
    }).catch(() => {});
  }

  res.clearCookie('lughx_session', { path: '/' });
  return res.json({ success: true, message: 'Đăng xuất thành công' });
});

export default router;