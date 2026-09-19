import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Hiển thị danh sách các lệnh khả dụng của LughxOmniBot'),
  
  async executeSlash(interaction: ChatInputCommandInteraction) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x06b6d4)
      .setTitle('🤖 LughxOmniBot - Bảng Trợ Giúp')
      .setDescription('Dưới đây là danh sách các lệnh Slash Commands hiện đang hoạt động trên hệ thống:')
      .addFields(
        { name: '/ping', value: 'Kiểm tra độ trễ (latency) của bot.', inline: false },
        { name: '/stats', value: 'Xem thống kê tài nguyên hệ thống, RAM, và số lượng server.', inline: false },
        { name: '/testwelcome', value: 'Giả lập gửi khung tin nhắn chào mừng (Welcome) vào kênh đã cấu hình.', inline: false },
        { name: '/help', value: 'Hiển thị bảng hướng dẫn này.', inline: false }
      )
      .setFooter({ text: 'LughxOmniBot • Quản lý server thông minh' })
      .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed], flags: 64 });
  }
};