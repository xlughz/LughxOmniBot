import { 
  Client, 
  GatewayIntentBits, 
  Message, 
  REST, 
  Routes, 
  Collection, 
  Interaction 
} from 'discord.js';
import { config } from 'dotenv';
import { join } from 'path';
import { prisma } from '@lughx/database';
import express from 'express';
import os from 'os';

// Import các modules lệnh
import * as pingCmd from './commands/ping';
import * as statsCmd from './commands/stats';
import * as helpCmd from './commands/help';

config({ path: join(__dirname, '../../../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const DEFAULT_PREFIX = '!l';

// Khởi tạo Collection lưu trữ Commands trong RAM của Bot
const commands = new Collection<string, any>();
const commandList = [pingCmd, statsCmd, helpCmd];
commandList.forEach(cmd => commands.set(cmd.data.name, cmd));

// --- Khởi tạo Internal API Server cho Bot (Cổng 5001) ---
const app = express();
const INTERNAL_PORT = 5001;

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

app.get('/internal/servers', (req, res) => {
  const servers = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({ extension: 'png', size: 64 }),
    memberCount: guild.memberCount,
  })).sort((a, b) => b.memberCount - a.memberCount);

  res.json(servers);
});

app.get('/internal/servers/:id', async (req, res) => {
  try {
    const guildId = req.params.id;
    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);

    if (!guild) return res.status(404).json({ error: 'Bot không có trong server này' });

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
    res.status(500).json({ error: 'Lỗi lấy dữ liệu server từ Bot' });
  }
});

app.listen(INTERNAL_PORT, () => {
  console.log(`[BOT-INTERNAL] API noi bo dang chay tai cong ${INTERNAL_PORT}`);
});

// --- Hàm Deploy Slash Commands (Ghi đè sạch sẽ danh sách lệnh) ---
async function deploySlashCommands(clientId: string, token: string) {
  const rest = new REST({ version: '10' }).setToken(token);
  const slashData = commandList.map(cmd => cmd.data.toJSON());

  try {
    console.log('[SLASH] Đang đồng bộ danh sách Slash Commands lên Discord...');
    // Ghi đè toàn bộ Global Commands (xóa sạch lệnh rác cũ)
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: slashData }
    );
    console.log(`[SLASH] Đồng bộ thành công ${slashData.length} lệnh Slash!`);
  } catch (error) {
    console.error('[SLASH_DEPLOY_ERROR] Lỗi khi deploy Slash Commands:', error);
  }
}

client.once('clientReady', async () => {
  console.log(`[BOT] LughxOmniBot đã online với tư cách: ${client.user?.tag}`);

  // Tự động deploy Slash commands ngay khi bot kết nối
  if (client.user?.id && process.env.DISCORD_BOT_TOKEN) {
    await deploySlashCommands(client.user.id, process.env.DISCORD_BOT_TOKEN);
  }
});

// --- 1. Xử lý Slash Commands (Interaction) ---
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.executeSlash(interaction);
  } catch (err) {
    console.error(`[COMMAND_ERROR] Lỗi khi chạy lệnh /${interaction.commandName}:`, err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
    }
  }
});

// --- 2. Xử lý Prefix Commands (Message) ---
client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.guild) return;

  // Lấy prefix riêng của Guild từ Database
  const config = await prisma.guildConfig.findUnique({
    where: { guildId: message.guild.id },
  }).catch(() => null);

  const currentPrefix = config?.prefix || DEFAULT_PREFIX;

  if (!message.content.startsWith(currentPrefix)) return;

  const args = message.content.slice(currentPrefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const cmd = commands.get(commandName);
  if (!cmd) return;

  try {
    if (commandName === 'help') {
      await cmd.executePrefix(message, currentPrefix);
    } else {
      await cmd.executePrefix(message);
    }
  } catch (err) {
    console.error(`[PREFIX_ERROR] Lỗi khi chạy lệnh ${currentPrefix}${commandName}:`, err);
    message.reply('Đã xảy ra lỗi khi thực thi lệnh!');
  }
});

// --- 3. Welcome Member Event ---
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