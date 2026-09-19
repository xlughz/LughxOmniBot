import { SlashCommandBuilder, CommandInteraction, Message, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Hiển thị danh sách câu lệnh hỗ trợ');

export async function executeSlash(interaction: CommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('LughxOmniBot - Bảng Lệnh')
    .setColor(0x38bdf8)
    .setDescription('Bot hỗ trợ cả Slash Command (`/`) và Prefix tùy chỉnh trên Dashboard.')
    .addFields(
      { name: '/ping', value: 'Kiểm tra độ trễ mạng và phản hồi Discord API' },
      { name: '/stats', value: 'Xem thông số phần cứng và tiến trình bot' },
      { name: '/help', value: 'Xem hướng dẫn này' }
    );

  await interaction.reply({ embeds: [embed] });
}

export async function executePrefix(message: Message, prefix: string) {
  const embed = new EmbedBuilder()
    .setTitle('LughxOmniBot - Bảng Lệnh')
    .setColor(0x38bdf8)
    .setDescription(`Prefix hiện tại của máy chủ: \`${prefix}\`\nBạn có thể dùng dạng \`${prefix}<lệnh>\` hoặc gõ thẳng \`/<lệnh>\`.`)
    .addFields(
      { name: `${prefix}ping`, value: 'Kiểm tra độ trễ mạng' },
      { name: `${prefix}stats`, value: 'Xem thông số hệ thống bot' },
      { name: `${prefix}help`, value: 'Xem hướng dẫn này' }
    );

  await message.reply({ embeds: [embed] });
}