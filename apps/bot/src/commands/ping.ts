import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Kiểm tra độ trễ của Bot và kết nối Discord Gateway.');

export async function executeSlash(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ content: 'Đang đo độ trễ...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const wsPing = interaction.client.ws.ping;

  const embed = new EmbedBuilder()
    .setColor(0x00FF7F)
    .setTitle('🏓 Pong!')
    .addFields(
      { name: 'Độ trễ phản hồi (Roundtrip)', value: `\`${latency}ms\``, inline: true },
      { name: 'Độ trễ Gateway (WebSocket)', value: `\`${wsPing}ms\``, inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ content: null, embeds: [embed] });
}

export const execute = executeSlash;