import { Client, GatewayIntentBits, Message } from 'discord.js';
import { config } from 'dotenv';
import { join } from 'path';
import { prisma } from '@lughx/database';
import express from 'express';
import os from 'os';

// Nạp biến môi trường từ thư mục gốc
config({ path: join(__dirname, '../../../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = '!l';

// --- Khởi tạo Internal API Server cho Bot ---
const app = express();
const INTERNAL_PORT = 5001;

// 1. Thống kê chung
app.get('/internal/stats', (req, res) => {
  res.json({
    totalBots: 1, 
    activeServers: client.guilds.cache.size, 
    systemPing: client.ws.ping, 
  });
});

// 2. Danh sách toàn bộ server
app.get('/internal/servers', (req, res) => {
  const servers = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({ extension: 'png', size: 64 }),
    memberCount: guild.memberCount,
  })).sort((a, b) => b.memberCount - a.memberCount);
  
  res.json(servers);
});

// 3. Chi tiết 1 server và danh sách kênh chat
app.get('/internal/servers/:id', async (req, res) => {
  try {
    const guildId = req.params.id;
    // Tìm trong cache trước, nếu không có thì kéo trực tiếp từ Discord API
    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);

    if (!guild) {
      return res.status(404).json({ error: 'Bot không có trong server này' });
    }

    // Đảm bảo fetch đầy đủ channels
    const channelsMap = await guild.channels.fetch().catch(() => guild.channels.cache);
    const channels = channelsMap
      ? Array.from(channelsMap.values())
          .filter(c => c && c.isTextBased())
          .map(c => ({ id: c.id, name: c.name }))
      : [];

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ extension: 'png', size: 256 }),
      channels,
    });
  } catch (error) {
    console.error('[INTERNAL_SERVER_DETAIL_ERROR]', error);
    res.status(500).json({ error: 'Lỗi lấy dữ liệu server từ Bot' });
  }
});

// Bắt đầu lắng nghe sau khi đã đăng ký toàn bộ endpoints
app.listen(INTERNAL_PORT, () => {
  console.log(`[BOT-INTERNAL] API noi bo dang chay tai cong ${INTERNAL_PORT}`);
});
// -------------------------------------------

client.once('clientReady', () => {
  console.log(`[BOT] LughxOmniBot đã online với tư cách: ${client.user?.tag}`);
});

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === 'ping') {
    const sent = await message.reply('Đang đo độ trễ...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    sent.edit(`Pong! Trễ mạng: \`${latency}ms\` | Discord API: \`${client.ws.ping}ms\``);
  }

  if (command === 'help') {
    message.reply('**LughxOmniBot - Danh sách lệnh:**\n`!lping` - Kiểm tra độ trễ mạng\n`!lhelp` - Xem bảng trợ giúp này');
  }
});

app.get('/internal/stats', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  res.json({
    totalBots: 1,
    activeServers: client.guilds.cache.size,
    systemPing: client.ws.ping,
    uptime: process.uptime(), 
    botMemoryMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(1),
    systemMemory: {
      usedMB: (usedMem / 1024 / 1024).toFixed(0),
      totalMB: (totalMem / 1024 / 1024).toFixed(0),
      usagePercent: ((usedMem / totalMem) * 100).toFixed(1),
    },
    cpuCores: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'VPS Virtual CPU',
    nodeVersion: process.version,
    discordJsVersion: require('discord.js').version || 'v14',
    status: client.isReady() ? 'Online' : 'Reconnecting'
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);