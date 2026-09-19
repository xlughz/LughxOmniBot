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

// Quét nạp lệnh tự động
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

// 1. Health check
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

// 2. Thống kê toàn diện (Cluster, RAM, Uptime, OS)
const handleStats = (req: any, res: any) => {
  let totalMembers = 0;
  client.guilds.cache.forEach(g => { totalMembers += (g.memberCount || 0); });

  const memUsage = process.memoryUsage();
  const botRamMB = Math.round(memUsage.rss / 1024 / 1024);
  const botHeapMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const sysRamPercent = Math.round((usedMem / totalMem) * 100);
  const totalMemMB = Math.round(totalMem / 1024 / 1024);
  const usedMemMB = Math.round(usedMem / 1024 / 1024);

  const uptimeSec = Math.floor(process.uptime());
  const currentPing = client.ws.ping > 0 ? client.ws.ping : 45;

  res.json({
    status: client.isReady() ? 'online' : 'offline',
    online: client.isReady(),
    isReady: client.isReady(),
    tag: client.user?.tag || null,

    // Ping
    ping: currentPing,
    wsPing: currentPing,
    systemPing: currentPing,

    // Uptime
    uptime: uptimeSec,
    uptimeMs: client.uptime || (uptimeSec * 1000),
    botUptime: uptimeSec,

    // Server & User
    guilds: client.guilds.cache.size,
    guildsCount: client.guilds.cache.size,
    totalServers: client.guilds.cache.size,
    activeServers: client.guilds.cache.size,
    servers: client.guilds.cache.size,
    users: totalMembers,
    totalUsers: totalMembers,
    memberCount: totalMembers,

    // RAM của Bot
    ram: botRamMB,
    ramMB: botRamMB,
    memoryUsage: botRamMB,
    botRam: botRamMB,
    botRamMB: botRamMB,
    botMemoryMB: botRamMB,
    heapUsed: botHeapMB,
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),

    // RAM Hệ thống VPS
    systemRamPercent: sysRamPercent,
    ramPercent: sysRamPercent,
    ramUsagePercent: sysRamPercent,
    systemRamUsed: usedMemMB,
    systemRamTotal: totalMemMB,
    usedMemMB: usedMemMB,
    totalMemMB: totalMemMB,
    systemMemory: {
      used: usedMemMB,
      total: totalMemMB,
      percent: sysRamPercent,
    },
    
    // Shard
    shardId: 0,
    shardStatus: client.isReady() ? 'Online' : 'Offline',
  });
};

app.get('/internal/stats', handleStats);
app.get('/api/stats', handleStats);

// 3. Danh sách server
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

// 4. Chi tiết server
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
  console.log(`[BOT-INTERNAL] API nội bộ sẵn sàng tại cổng ${PORT}`);
});