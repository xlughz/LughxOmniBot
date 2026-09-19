import { 
  Client, 
  GatewayIntentBits, 
  Message, 
  REST, 
  Routes, 
  Collection, 
  Interaction, 
  GuildMember
} from 'discord.js';
import { config } from 'dotenv';
import { join } from 'path';
import { prisma } from '@lughx/database';
import express from 'express';
import os from 'os';

// Tích hợp Shoukaku Lavalink v4 Client
import { Shoukaku, Connectors } from 'shoukaku';

// Import các modules lệnh
import * as pingCmd from './commands/ping';
import * as statsCmd from './commands/stats';
import * as helpCmd from './commands/help';
import * as playCmd from './commands/play';

// Nạp biến môi trường từ thư mục gốc
config({ path: join(__dirname, '../../../.env') });

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const DEFAULT_PREFIX = '!l';

// Khởi tạo Collection lưu trữ Commands
const commands = new Collection<string, any>();
const commandList = [pingCmd, statsCmd, helpCmd, playCmd];
commandList.forEach(cmd => commands.set(cmd.data.name, cmd));

// Cấu hình Node Lavalink v4 dùng IPv4 tường minh
const Nodes = [{
  name: 'lughx-lavalink',
  url: '127.0.0.1:2333',
  auth: 'youshallnotpass',
  secure: false
}];

export const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);

shoukaku.on('ready', (name: string) => {
  console.log('[LAVALINK] Node ' + name + ' đã kết nối thành công!');
});

shoukaku.on('error', (name: string, error: unknown) => {
  console.error('[LAVALINK] Lỗi Node ' + name + ':', error);
});

// Quản lý hàng đợi âm thanh cho từng Guild
export const musicQueues = new Map<string, {
  player: any;
  textChannelId: string;
  currentTrack: any;
  queue: any[];
  loopMode: 'off' | 'single' | 'all';
  volume: number;
}>();

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
          .filter((c): c is NonNullable<typeof c> => c !== null && c !== undefined && c.isTextBased())
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

app.listen(INTERNAL_PORT, () => {
  console.log('[BOT-INTERNAL] API nội bộ đang chạy tại cổng ' + INTERNAL_PORT);
});

// Triển khai Slash Commands duy nhất
async function deploySlashCommands(clientId: string, token: string) {
  const rest = new REST({ version: '10' }).setToken(token);
  const slashData = commandList.map(cmd => cmd.data.toJSON());

  try {
    console.log('[SLASH] Đang dọn dẹp các lệnh Guild cũ và đồng bộ Slash Commands...');

    for (const guild of client.guilds.cache.values()) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guild.id),
        { body: [] }
      ).catch(() => null);
    }

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: slashData }
    );

    console.log('[SLASH] Đã dọn sạch trùng lặp và đồng bộ thành công ' + slashData.length + ' lệnh Global duy nhất!');
  } catch (error) {
    console.error('[SLASH_DEPLOY_ERROR] Lỗi khi deploy Slash Commands:', error);
  }
}

client.once('clientReady', async () => {
  console.log('[BOT] LughxOmniBot đã online với tư cách: ' + (client.user?.tag || 'Bot'));

  if (client.user?.id && process.env.DISCORD_BOT_TOKEN) {
    await deploySlashCommands(client.user.id, process.env.DISCORD_BOT_TOKEN);
  }
});

// Lắng nghe tương tác Buttons, Modals, Slash Commands
client.on('interactionCreate', async (interaction: Interaction) => {
  if (interaction.isButton()) {
    if (!interaction.guildId) return;
    const q = musicQueues.get(interaction.guildId);

    if (interaction.customId === 'music_add_modal') {
      const modal = playCmd.createMusicModal();
      return interaction.showModal(modal);
    }

    if (!q || !q.player) {
      return interaction.reply({ content: '⌁ Hiện không có bài hát nào đang phát!', ephemeral: true });
    }

    switch (interaction.customId) {
      case 'music_pause_resume':
        if (q.player.paused) {
          await q.player.setPaused(false);
          await interaction.reply({ content: '▶️ Đã tiếp tục phát nhạc!', ephemeral: true });
        } else {
          await q.player.setPaused(true);
          await interaction.reply({ content: '⏸️ Đã tạm dừng phát nhạc!', ephemeral: true });
        }
        break;

      case 'music_skip':
        await q.player.stopTrack();
        await interaction.reply({ content: '⏭️ Đã chuyển sang bài tiếp theo!', ephemeral: true });
        break;

      case 'music_loop': {
        const next = q.loopMode === 'off' ? 'single' : q.loopMode === 'single' ? 'all' : 'off';
        q.loopMode = next;
        const text = next === 'off' ? 'Tắt' : next === 'single' ? 'Lặp 1 bài' : 'Lặp toàn bộ';
        await interaction.reply({ content: '🔁 Chế độ lặp: **' + text + '**', ephemeral: true });
        break;
      }

      case 'music_stop':
        q.queue = [];
        if (interaction.guildId) {
          await shoukaku.leaveVoiceChannel(interaction.guildId);
          musicQueues.delete(interaction.guildId);
        }
        await interaction.reply({ content: '⏹️ Đã ngắt kết nối kênh thoại!', ephemeral: true });
        break;

      case 'music_vol_up': {
        const newVol = Math.min(q.volume + 10, 150);
        q.volume = newVol;
        await q.player.setFilterVolume(newVol / 100);
        await interaction.reply({ content: '🔊 Đã tăng âm lượng lên: **' + newVol + '%**', ephemeral: true });
        break;
      }

      case 'music_vol_down': {
        const newVol = Math.max(q.volume - 10, 10);
        q.volume = newVol;
        await q.player.setFilterVolume(newVol / 100);
        await interaction.reply({ content: '🔉 Đã giảm âm lượng xuống: **' + newVol + '%**', ephemeral: true });
        break;
      }

      case 'music_shuffle':
        q.queue.sort(() => Math.random() - 0.5);
        await interaction.reply({ content: '🔀 Đã xáo trộn danh sách bài hát!', ephemeral: true });
        break;

      case 'music_queue': {
        const items = q.queue.slice(0, 5).map((t, idx) => (idx + 1) + '. **' + t.info.title + '**').join('\n');
        await interaction.reply({
          content: '📜 **Hàng Đợi Hiện Tại (' + q.queue.length + ' bài):**\n' + (items || '*Trống*'),
          ephemeral: true,
        });
        break;
      }
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'music_link_modal') {
      const query = interaction.fields.getTextInputValue('music_query_input');
      const member = interaction.member as GuildMember;
      const voiceChannel = member?.voice?.channel;

      if (!voiceChannel) {
        return interaction.reply({ content: '⌁ Bạn cần kết nối vào kênh Voice trước!', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      try {
        await playCmd.playTrackLogic(voiceChannel, interaction.channelId || '', query, member.user);
        await interaction.editReply({ content: '✦ Đã nạp thành công yêu cầu: `' + query + '`' });
      } catch (err: any) {
        await interaction.editReply({ content: '⚠️ Lỗi phát nhạc: `' + (err.message || 'Lỗi không xác định') + '`' });
      }
    }
    return;
  }

  if (interaction.isChatInputCommand()) {
    const cmd = commands.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.executeSlash(interaction as any);
    } catch (err) {
      console.error('[COMMAND_ERROR] Lỗi /' + interaction.commandName + ':', err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
      }
    }
  }
});

// Lắng nghe Prefix Commands
client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.guild) return;

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
    } else if (commandName === 'lplay' || commandName === 'play') {
      await cmd.executePrefix(message, args);
    } else {
      await cmd.executePrefix(message);
    }
  } catch (err) {
    console.error('[PREFIX_ERROR] Lỗi lệnh ' + currentPrefix + commandName + ':', err);
    message.reply('Đã xảy ra lỗi khi thực thi lệnh!');
  }
});

// Chào mừng thành viên mới
client.on('guildMemberAdd', async (member) => {
  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: member.guild.id },
    }).catch(() => null);

    if (!config || !config.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (channel && channel.isTextBased()) {
      channel.send('Chào mừng ' + member.toString() + ' đã tham gia máy chủ **' + member.guild.name + '**! 🎉');
    }
  } catch (err) {
    console.error('[WELCOME_ERROR]', err);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);