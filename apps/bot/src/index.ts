import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection, 
  Events, 
  REST, 
  Routes 
} from 'discord.js';
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

dotenv.config();

const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('[BOT_ERROR] Thiếu DISCORD_TOKEN hoặc DISCORD_BOT_TOKEN trong .env!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User],
});

export const commands = new Collection<string, any>();
const commandsArray: any[] = [];

// 1. Quét nạp tự động toàn bộ lệnh trong thư mục commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('play.')
  );

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    import(filePath).then((commandModule) => {
      const command = commandModule.default || commandModule;
      if (command.data && (command.execute || command.executeSlash)) {
        commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
        console.log(`[COMMAND] Đã nạp lệnh: /${command.data.name}`);
      }
    }).catch(err => {
      console.error(`[COMMAND_LOAD_ERROR] Không thể nạp ${file}:`, err);
    });
  }
}

// 2. Đồng bộ Slash Commands lên Discord Gateway khi sẵn sàng
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[BOT] LughxOmniBot đã online với tư cách: ${readyClient.user.tag}`);

  setTimeout(async () => {
    const rest = new REST({ version: '10' }).setToken(token);
    try {
      console.log(`[SLASH] Đang đồng bộ ${commandsArray.length} Slash Commands...`);
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body: commandsArray }
      );
      console.log('[SLASH] Đồng bộ Slash Commands thành công!');
    } catch (error) {
      console.error('[SLASH_ERROR] Lỗi đồng bộ Slash Commands:', error);
    }
  }, 2000);
});

// 3. Xử lý Interaction
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      if (command.executeSlash) {
        await command.executeSlash(interaction);
      } else if (command.execute) {
        await command.execute(interaction);
      }
    } catch (error) {
      console.error(`[EXECUTE_ERROR] /${interaction.commandName}:`, error);
      const replyContent = { content: '❌ Có lỗi xảy ra khi thực thi lệnh!', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(replyContent);
      } else {
        await interaction.reply(replyContent);
      }
    }
  }
});

client.login(token);

// ================= CỔNG NỘI BỘ 5001 CHO BACKEND DASHBOARD =================
const app = express();
app.use(express.json());

// Health Check
app.get(['/api/health', '/internal/health'], (req, res) => {
  res.json({
    status: 'ok',
    botOnline: client.isReady(),
    botTag: client.user?.tag || null,
    guildsCount: client.guilds.cache.size,
    ping: client.ws.ping,
    uptime: client.uptime,
  });
});

// Thống kê chi tiết Realtime (RAM Bot, RAM VPS, Uptime, Ping, Server/User)
const handleStats = (req: any, res: any) => {
  let totalMembers = 0;
  client.guilds.cache.forEach(g => { totalMembers += (g.memberCount || 0); });

  const memUsage = process.memoryUsage();
  const botRamMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const sysPercent = Math.round((usedMem / totalMem) * 100);
  const totalMB = Math.round(totalMem / 1024 / 1024);
  const usedMB = Math.round(usedMem / 1024 / 1024);

  const uptimeSec = Math.floor(process.uptime());
  const currentPing = client.ws.ping > 0 ? client.ws.ping : 45;

  res.json({
    status: 'online',
    online: true,
    isReady: true,
    tag: client.user?.tag || null,

    // Ping
    systemPing: currentPing,
    ping: currentPing,
    wsPing: currentPing,

    // Uptime
    uptime: uptimeSec,
    botUptime: uptimeSec,
    uptimeMs: client.uptime || (uptimeSec * 1000),

    // Server & User counts
    totalServers: client.guilds.cache.size,
    activeServers: client.guilds.cache.size,
    guilds: client.guilds.cache.size,
    guildsCount: client.guilds.cache.size,
    totalUsers: totalMembers,
    users: totalMembers,
    memberCount: totalMembers,

    // RAM của Bot
    botRamMB: botRamMB,
    ramMB: botRamMB,
    memoryUsage: botRamMB,
    ram: botRamMB,
    heapUsed: botRamMB,
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),

    // RAM Hệ thống VPS (Khớp chuẩn các key của BotCluster.tsx)
    systemMemory: {
      usagePercent: sysPercent,
      usedMB: usedMB,
      totalMB: totalMB,
      percent: sysPercent,
      used: usedMB,
      total: totalMB,
    },
    systemRamPercent: sysPercent,
    systemRamUsed: usedMB,
    systemRamTotal: totalMB,

    shardId: 0,
    shardStatus: 'online',
  });
};

app.get('/internal/stats', handleStats);
app.get('/api/stats', handleStats);

// Danh sách Guilds
const handleServers = (req: any, res: any) => {
  const list = client.guilds.cache.map(g => ({
    id: g.id,
    name: g.name,
    icon: g.iconURL(),
    memberCount: g.memberCount,
    joinedTimestamp: g.joinedTimestamp,
  }));
  res.json(list);
};
app.get('/internal/servers', handleServers);
app.get('/api/guilds', handleServers);

// Chi tiết Guild
app.get('/internal/servers/:id', (req, res) => {
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) {
    return res.status(404).json({ error: 'Server không tìm thấy' });
  }

  res.json({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL(),
    memberCount: guild.memberCount,
    channelsCount: guild.channels.cache.size,
    rolesCount: guild.roles.cache.size,
    joinedTimestamp: guild.joinedTimestamp,
  });
});

const PORT = process.env.BOT_INTERNAL_PORT || 5001;
app.listen(PORT, () => {
  console.log(`[BOT-INTERNAL] API nội bộ đang chạy tại cổng ${PORT}`);
});