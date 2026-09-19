import { SlashCommandBuilder, CommandInteraction, Message, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Xem tổng quan tài nguyên hệ thống Bot');

export async function executeSlash(interaction: CommandInteraction) {
  const client = interaction.client;
  const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const uptime = Math.floor(process.uptime());

  const embed = new EmbedBuilder()
    .setTitle('Thống Kê Hệ Thống')
    .setColor(0x38bdf8)
    .addFields(
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
      { name: 'RAM Bot', value: `${memory} MB`, inline: true },
      { name: 'Uptime', value: `${uptime}s`, inline: true }
    );

  await interaction.reply({ embeds: [embed] });
}

export async function executePrefix(message: Message) {
  const client = message.client;
  const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const uptime = Math.floor(process.uptime());

  const embed = new EmbedBuilder()
    .setTitle('Thống Kê Hệ Thống')
    .setColor(0x38bdf8)
    .addFields(
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
      { name: 'RAM Bot', value: `${memory} MB`, inline: true },
      { name: 'Uptime', value: `${uptime}s`, inline: true }
    );

  await message.reply({ embeds: [embed] });
}