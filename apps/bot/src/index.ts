import { Client, GatewayIntentBits, Message } from 'discord.js';
import { config } from 'dotenv';
import { join } from 'path';
import { prisma } from '@lughx/database';
import express from 'express'; // Thêm Express cho Internal API

// Nạp biến môi trường từ thư mục gốc
config({ path: join(__dirname, '../../../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Bắt buộc phải có để đọc được tin nhắn (prefix !l)
  ],
});

const PREFIX = '!l';

// --- Khởi tạo Internal API Server cho Bot ---
const app = express();
const INTERNAL_PORT = 5001;

app.get('/internal/stats', (req, res) => {
  res.json({
    totalBots: 1, 
    activeServers: client.guilds.cache.size, 
    systemPing: client.ws.ping, 
  });
});

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

client.login(process.env.DISCORD_BOT_TOKEN);