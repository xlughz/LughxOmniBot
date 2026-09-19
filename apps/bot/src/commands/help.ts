import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Hiển thị danh sách các lệnh đang hoạt động trên hệ thống.');

export async function executeSlash(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x6366F1)
    .setTitle('📖 Danh Sách Lệnh Khả Dụng')
    .setDescription('Hệ thống bot đã đưa về kiến trúc tiêu chuẩn với các lệnh hệ thống chính:')
    .addFields(
      { name: '</ping:0>', value: 'Kiểm tra độ trễ mạng và phản hồi Gateway.' },
      { name: '</stats:0>', value: 'Xem chi tiết mức tiêu thụ RAM, Uptime và số máy chủ.' },
      { name: '</help:0>', value: 'Mở bảng trợ giúp này.' }
    )
    .setFooter({ text: 'Lughx Omni Bot Framework' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export const execute = executeSlash;