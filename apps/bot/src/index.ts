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

// Tích hợp DisTube Audio Engine
import { DisTube } from 'distube';
import { SpotifyPlugin } from '@distube/spotify';
import { SoundCloudPlugin } from '@distube/soundcloud';
import { YtDlpPlugin } from '@distube/yt-dlp';

// Import các modules lệnh
import * as pingCmd from './commands/ping';
import * as statsCmd from './commands/stats';
import * as helpCmd from './commands/help';
import * as playCmd from './commands/play';

// Nạp biến môi trường từ thư mục gốc
config({ path: join(__dirname, '../../../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates, // Bắt buộc để bot kết nối Voice và stream nhạc
  ],
});

const DEFAULT_PREFIX = '!l';

// Khởi tạo Collection lưu trữ Commands
const commands = new Collection<string, any>();
const commandList = [pingCmd, statsCmd, helpCmd, playCmd];
commandList.forEach(cmd => commands.set(cmd.data.name, cmd));

// --- Khởi tạo DisTube Music Engine ---
const distube = new DisTube(client, {
  emitNewSongOnly: true,
  leaveOnEmpty: true,
  leaveOnStop: true,
  plugins: [
    new SpotifyPlugin(),
    new SoundCloudPlugin(),
    new YtDlpPlugin(),
  ],
});

// Tự động phát sinh Embed Controller khi bài hát mới bắt đầu phát
distube.on('playSong', (queue, song) => {
  const embed = playCmd.createMusicEmbed(song, true, queue);
  const components = playCmd.createMusicControls(true);
  queue.textChannel?.send({ embeds: [embed], components });
});

distube.on('addSong', (queue, song) => {
  queue.textChannel?.send(`⌁ Đã thêm vào danh sách phát: **${song.name}** \`[${song.formattedDuration}]\``);
});

distube.on('error', (channel, error) => {
  console.error('[DISTUBE_ERROR]', error);
  if (channel && 'send' in channel) {
    (channel as any).send(`⚠️ Đã xảy ra lỗi xử lý âm thanh: \`${error.message.slice(0, 100)}\``);
  }
});

// --- Khởi tạo Internal API Server cho Bot (Cổng 5001) ---
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
    console.error('[INTERNAL_SERVER_DETAIL_ERROR]', error);
    res.status(500).json({ error: 'Lỗi lấy dữ liệu server từ Bot' });
  }
});

// Lắng nghe cổng nội bộ
app.listen(INTERNAL_PORT, () => {
  console.log(`[BOT-INTERNAL] API nội bộ đang chạy tại cổng ${INTERNAL_PORT}`);
});

// --- Hàm Deploy Slash Commands lên Discord Gateway ---
async function deploySlashCommands(clientId: string, token: string) {
  const rest = new REST({ version: '10' }).setToken(token);
  const slashData = commandList.map(cmd => cmd.data.toJSON());

  try {
    console.log('[SLASH] Đang đồng bộ danh sách Slash Commands lên Discord...');
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

  if (client.user?.id && process.env.DISCORD_BOT_TOKEN) {
    await deploySlashCommands(client.user.id, process.env.DISCORD_BOT_TOKEN);
  }
});

// --- Lắng nghe các tương tác (Slash Commands, Buttons, Modals) ---
client.on('interactionCreate', async (interaction: Interaction) => {
  // 1. Tương tác Nút bấm trên Music Controller
  if (interaction.isButton()) {
    const queue = distube.getQueue(interaction.guildId!);

    if (interaction.customId === 'music_add_modal') {
      const modal = playCmd.createMusicModal();
      return interaction.showModal(modal);
    }

    if (!queue) {
      return interaction.reply({ content: '⌁ Hiện không có bài hát nào đang phát!', ephemeral: true });
    }

    switch (interaction.customId) {
      case 'music_pause_resume':
        if (queue.playing) {
          distube.pause(interaction.guildId!);
          await interaction.reply({ content: '⏸ Đã tạm dừng phát nhạc!', ephemeral: true });
        } else {
          distube.resume(interaction.guildId!);
          await interaction.reply({ content: '⏵ Đã tiếp tục phát nhạc!', ephemeral: true });
        }
        break;

      case 'music_skip':
        await distube.skip(interaction.guildId!).catch(() => distube.stop(interaction.guildId!));
        await interaction.reply({ content: '⏭ Đã chuyển bài tiếp theo!', ephemeral: true });
        break;

      case 'music_loop': {
        const mode = distube.setRepeatMode(interaction.guildId!);
        const modeText = mode === 0 ? 'Tắt' : mode === 1 ? 'Lặp 1 bài' : 'Lặp toàn bộ hàng đợi';
        await interaction.reply({ content: `𝄪 Chế độ lặp: **${modeText}**`, ephemeral: true });
        break;
      }

      case 'music_stop':
        distube.stop(interaction.guildId!);
        await interaction.reply({ content: '⏹ Đã dừng phát nhạc và rời kênh voice!', ephemeral: true });
        break;

      case 'music_vol_up': {
        const newVol = Math.min(queue.volume + 10, 150);
        distube.setVolume(interaction.guildId!, newVol);
        await interaction.reply({ content: `▷ Đã tăng âm lượng lên: **${newVol}%**`, ephemeral: true });
        break;
      }

      case 'music_vol_down': {
        const newVol = Math.max(queue.volume - 10, 10);
        distube.setVolume(interaction.guildId!, newVol);
        await interaction.reply({ content: `◁ Đã giảm âm lượng xuống: **${newVol}%**`, ephemeral: true });
        break;
      }

      case 'music_shuffle':
        await distube.shuffle(interaction.guildId!);
        await interaction.reply({ content: '𖦹 Đã xáo trộn danh sách phát!', ephemeral: true });
        break;

      case 'music_queue': {
        const qList = queue.songs
          .slice(0, 5)
          .map((s, idx) => `\`${idx + 1}.\` **${s.name}** \`[${s.formattedDuration}]\``)
          .join('\n');
        await interaction.reply({
          content: `✦ **Hàng Đợi Hiện Tại (${queue.songs.length} bài):**\n${qList}${queue.songs.length > 5 ? '\n*...và các bài khác*' : ''}`,
          ephemeral: true,
        });
        break;
      }
    }
    return;
  }

  // 2. Tương tác gửi Form Modal nạp nhạc
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'music_link_modal') {
      const query = interaction.fields.getTextInputValue('music_query_input');
      const member = interaction.member as GuildMember;
      const voiceChannel = member?.voice?.channel;

      if (!voiceChannel) {
        return interaction.reply({ content: '⌁ Bạn cần kết nối vào kênh Voice trước!', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      await distube.play(voiceChannel, query, {
        member,
        textChannel: interaction.channel as any,
      });
      await interaction.editReply({ content: `✦ Đã nạp thành công yêu cầu: \`${query}\`` });
    }
    return;
  }

  // 3. Thực thi Slash Commands
  if (interaction.isChatInputCommand()) {
    const cmd = commands.get(interaction.commandName);
    if (!cmd) return;

    try {
      if (interaction.commandName === 'lplay') {
        await cmd.executeSlash(interaction, distube);
      } else {
        await cmd.executeSlash(interaction);
      }
    } catch (err) {
      console.error(`[COMMAND_ERROR] Lỗi khi chạy lệnh /${interaction.commandName}:`, err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
      }
    }
  }
});

// --- Lắng nghe Prefix Commands (Tin nhắn) ---
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
      await cmd.executePrefix(message, distube, args);
    } else {
      await cmd.executePrefix(message);
    }
  } catch (err) {
    console.error(`[PREFIX_ERROR] Lỗi khi chạy lệnh ${currentPrefix}${commandName}:`, err);
    message.reply('Đã xảy ra lỗi khi thực thi lệnh!');
  }
});

// --- Sự kiện Chào mừng Thành viên Mới ---
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