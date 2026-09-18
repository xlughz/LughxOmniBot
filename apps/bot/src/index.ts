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
    GatewayIntentBits.GuildMembers, // Cần thiết để lắng nghe sự kiện guildMemberAdd
  ],
});

const PREFIX = '!l';

// --- Khởi tạo Internal API Server cho Bot ---
const app = express();
const INTERNAL_PORT = 5001;

// 1. Thống kê chi tiết tài nguyên hệ thống và bot
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
    status: client.isReady() ? 'Online' : 'Reconnecting',
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
    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);

    if (!guild) {
      return res.status(404).json({ error: 'Bot không có trong server này' });
    }

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

// Xử lý lệnh theo Prefix động từ Database
client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.guild) return;

  const config = await prisma.guildConfig.findUnique({
    where: { guildId: message.guild.id },
  }).catch(() => null);

  const currentPrefix = config?.prefix || PREFIX;

  if (!message.content.startsWith(currentPrefix)) return;

  const args = message.content.slice(currentPrefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === 'ping') {
    const sent = await message.reply('Đang đo độ trễ...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    sent.edit(`Pong! Trễ mạng: \`${latency}ms\` | Discord API: \`${client.ws.ping}ms\``);
  }

  if (command === 'help') {
    message.reply(`**LughxOmniBot - Danh sách lệnh (Prefix: \`${currentPrefix}\`):**\n\`${currentPrefix}ping\` - Kiểm tra độ trễ mạng\n\`${currentPrefix}help\` - Xem bảng trợ giúp này`);
  }
});

// Gửi tin nhắn chào mừng vào kênh đã cấu hình
client.on('guildMemberAdd', async (member) => {
  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: member.guild.id },
    }).catch(() => null);

    if (!config || !config.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (channel && channel.isTextBased()) {
      channel.send(`Chào mừng ${member} đã tham gia máy chủ **${member.guild.name}**! 🎉`);
    }
  } catch (err) {
    console.error('[WELCOME_ERROR]', err);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);