import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import os from 'os';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Xem thông số tài nguyên VPS và tình trạng tiến trình Bot.');

export async function executeSlash(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;
  const memUsage = process.memoryUsage();
  const botRamMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemMB = Math.round((totalMem - freeMem) / 1024 / 1024);
  const totalMemMB = Math.round(totalMem / 1024 / 1024);
  const memPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

  const uptimeSec = Math.floor(process.uptime());
  const h = Math.floor(uptimeSec / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const s = uptimeSec % 60;
  const uptimeStr = `${h}h ${m}m ${s}s`;

  let totalMembers = 0;
  client.guilds.cache.forEach(g => { totalMembers += (g.memberCount || 0); });

  const embed = new EmbedBuilder()
    .setColor(0x00BFFF)
    .setTitle('📊 Thông Số Hệ Thống Lughx Omni')
    .addFields(
      { name: 'Máy chủ kết nối', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Tổng thành viên', value: `${totalMembers}`, inline: true },
      { name: 'WebSocket Ping', value: `${client.ws.ping}ms`, inline: true },
      { name: 'RAM Bot (Heap)', value: `${botRamMB} MB`, inline: true },
      { name: 'RAM VPS', value: `${usedMemMB} / ${totalMemMB} MB (${memPercent}%)`, inline: true },
      { name: 'Thời gian chạy', value: uptimeStr, inline: true }
    )
    .setFooter({ text: `Node.js ${process.version} • Discord.js v14` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export const execute = executeSlash;