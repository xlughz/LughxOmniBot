import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection, 
  Events, 
  REST, 
  Routes,
  ChannelType,
  EmbedBuilder
} from 'discord.js';
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { prisma } from '@lughx/database';

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

// 2. Tự động dọn sạch lệnh cũ và đồng bộ đè danh sách lệnh mới lên Discord
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[BOT] LughxOmniBot đã online: ${readyClient.user.tag}`);

  // Giả lập sự kiện chào mừng khi bot vừa khởi động để test nhanh giao diện
  setTimeout(() => {
    const guild = readyClient.guilds.cache.first();
    if (guild) {
      const member = guild.members.cache.first();
      if (member) {
        console.log(`[TEST] Đang giả lập sự kiện chào mừng cho user: ${member.user.tag}`);
        client.emit('guildMemberAdd', member);
      }
    }
  }, 4000);

  setTimeout(async () => {
    const rest = new REST({ version: '10' }).setToken(token);
    try {
      console.log('[SLASH] Bắt đầu đồng bộ danh sách Slash Commands...');
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body: commandsArray }
      );

      for (const [guildId] of readyClient.guilds.cache) {
        await rest.put(
          Routes.applicationGuildCommands(readyClient.user.id, guildId),
          { body: [] }
        ).catch(() => {});
      }

      console.log('[SLASH] Đã dọn sạch lệnh cũ và cập nhật Slash Commands thành công!');
    } catch (error) {
      console.error('[SLASH_ERROR] Lỗi đồng bộ Slash Commands:', error);
    }
  }, 2500);
});

// 3. Xử lý khi người dùng gõ lệnh Slash
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
      const replyContent = { content: '❌ Có lỗi xảy ra khi thực thi lệnh!', flags: 64 };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(replyContent);
      } else {
        await interaction.reply(replyContent);
      }
    }
  }
});

// 4. Xử lý sự kiện chào mừng thành viên mới (GuildMemberAdd)
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: member.guild.id } });
    if (!config?.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId) 
      || await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);

    if (channel && channel.isTextBased()) {
      const adminRoleId = "1550897096779899003"; 
      const welcomeGifUrl = "https://i.pinimg.com/originals/1f/73/60/1f736040a3868b98c8c4fb9146a7b955.gif";

      const ticketId = "1417021896909918218";
      const tosId = "1416786343710822550";
      const legitId = "1531985290292498453";
      const priceId = "1417913643156115598";

      const customMsg = (config as any).welcomeMessage;
      const embed = new EmbedBuilder()
        .setColor(0x2f3136)
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ size: 128 }) })
        .setTitle(`Welcome to ${member.guild.name} 🤖`)
        .setDescription(
          customMsg || 
          (`😎 **Server tụi mình chuyên cho thuê acc Free Fire và một số dịch vụ khác nếu bạn cần** 😎,\n\n` +
           `> 🎫 <#${ticketId}> : ticket support\n` +
           `> 📦 <#${tosId}> : chính sách / tos\n` +
           `> 💼 <#${legitId}> : check legit\n` +
           `> 🥐 <#${priceId}> : bảng giá\n\n` +
           `*Mọi thắc mắc vui lòng liên hệ qua <@&${adminRoleId}> để được hỗ trợ.*`)
        )
        .setImage(welcomeGifUrl)
        .setTimestamp();

      await (channel as any).send({ content: `Hi ${member} chúc bạn một ngày tốt lành`, embeds: [embed] });
      console.log(`[WELCOME] Đã gửi thông báo chào mừng cho ${member.user.tag}`);
    }
  } catch (error) {
    console.error('[WELCOME_ERROR]', error);
  }
});

// 5. Xử lý sự kiện thành viên rời server (GuildMemberRemove - Goodbye)
client.on(Events.GuildMemberRemove, async (member) => {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: member.guild.id } });
    const goodbyeChanId = (config as any)?.goodbyeChannelId;
    if (!goodbyeChanId) return;

    const channel = member.guild.channels.cache.get(goodbyeChanId) 
      || await member.guild.channels.fetch(goodbyeChanId).catch(() => null);

    if (channel && channel.isTextBased()) {
      const customGoodbyeMsg = (config as any)?.goodbyeMessage;
      const goodbyeEmbed = new EmbedBuilder()
        .setColor(0xef4444)
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ size: 128 }) })
        .setTitle(`Tạm biệt thành viên! 👋`)
        .setDescription(
          customGoodbyeMsg || 
          `😢 **${member.user.tag}** đã rời khỏi server **${member.guild.name}**. Hẹn gặp lại bạn vào một ngày gần nhất!`
        )
        .setTimestamp();

      await (channel as any).send({ content: `Goodbye ${member}!`, embeds: [goodbyeEmbed] });
      console.log(`[GOODBYE] Đã gửi thông báo tạm biệt cho ${member.user.tag}`);
    }
  } catch (error) {
    console.error('[GOODBYE_ERROR]', error);
  }
});

// 6. Xử lý tin nhắn văn bản thông thường theo Prefix động từ Database
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: message.guild.id },
    });
    const prefix = config?.prefix || '!l';

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    if (commandName === 'ping') {
      message.reply(`🏓 Pong! Độ trễ bot: **${client.ws.ping}ms**`);
    } else if (commandName === 'help') {
      message.reply(`📌 **Tiền tố hiện tại:** \`${prefix}\`\nCác lệnh khả dụng: \`${prefix}ping\`, \`${prefix}help\``);
    }
  } catch (error) {
    console.error('[PREFIX_COMMAND_ERROR]', error);
  }
});

client.login(token);

// ================= CỔNG NỘI BỘ 5001 CHO BACKEND DASHBOARD =================
const app = express();
app.use(express.json());

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
    systemPing: currentPing,
    ping: currentPing,
    wsPing: currentPing,
    uptime: uptimeSec,
    botUptime: uptimeSec,
    uptimeMs: client.uptime || (uptimeSec * 1000),
    totalServers: client.guilds.cache.size,
    activeServers: client.guilds.cache.size,
    guilds: client.guilds.cache.size,
    guildsCount: client.guilds.cache.size,
    totalUsers: totalMembers,
    users: totalMembers,
    memberCount: totalMembers,
    botRamMB: botRamMB,
    ramMB: botRamMB,
    memoryUsage: botRamMB,
    ram: botRamMB,
    heapUsed: botRamMB,
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
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

app.get('/internal/servers/:id', async (req, res) => {
  try {
    const guildId = req.params.id;
    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);

    if (!guild) {
      return res.status(404).json({ error: 'Server không tìm thấy' });
    }

    const fetchedChannels = await guild.channels.fetch().catch(() => guild.channels.cache);

    const textChannels: any[] = [];
    fetchedChannels.forEach((channel: any) => {
      if (channel && (channel.type === 0 || channel.type === ChannelType.GuildText)) {
        textChannels.push({
          id: channel.id,
          name: channel.name,
          position: channel.position ?? 0,
        });
      }
    });

    textChannels.sort((a, b) => a.position - b.position);

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount,
      channelsCount: textChannels.length,
      rolesCount: guild.roles.cache.size,
      joinedTimestamp: guild.joinedTimestamp,
      channels: textChannels,
    });
  } catch (error) {
    console.error('[SERVER_DETAIL_ERROR]', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin máy chủ' });
  }
});

const PORT = process.env.BOT_INTERNAL_PORT || 5001;
app.listen(PORT, () => {
  console.log(`[BOT-INTERNAL] API nội bộ đang chạy tại cổng ${PORT}`);
});