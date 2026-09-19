import { SlashCommandBuilder, CommandInteraction, Message } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Kiểm tra độ trễ mạng và phản hồi Discord API');

export async function executeSlash(interaction: CommandInteraction) {
  const sent = await interaction.reply({ content: 'Đang đo độ trễ...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  await interaction.editReply(`Pong! Trễ mạng: \`${latency}ms\` | Discord API: \`${interaction.client.ws.ping}ms\``);
}

export async function executePrefix(message: Message) {
  const sent = await message.reply('Đang đo độ trễ...');
  const latency = sent.createdTimestamp - message.createdTimestamp;
  await sent.edit(`Pong! Trễ mạng: \`${latency}ms\` | Discord API: \`${message.client.ws.ping}ms\``);
}