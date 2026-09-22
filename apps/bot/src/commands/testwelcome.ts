import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { prisma } from '@lughx/database';

export default {
  data: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Giả lập gửi thử tin nhắn chào mừng vào kênh cấu hình trên Dashboard'),

  async executeSlash(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'Lệnh này chỉ dùng được trong Server!', flags: 64 });
    }

    try {
      const config = await prisma.guildConfig.findUnique({
        where: { guildId: interaction.guild.id },
      });

      const welcomeChannelId = config?.welcomeChannelId;

      if (!welcomeChannelId) {
        return interaction.reply({ 
          content: '❌ Server này chưa chọn Kênh Chào Mừng trên Web Dashboard! Vui lòng vào web cấu hình trước.', 
          flags: 64 
        });
      }

      const channel = interaction.guild.channels.cache.get(welcomeChannelId)
        || await interaction.guild.channels.fetch(welcomeChannelId).catch(() => null);

      if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: '❌ Không tìm thấy kênh text chào mừng đã cấu hình trên Discord!', flags: 64 });
      }

      const smallRightGifUrl = "https://i.pinimg.com/originals/c9/ae/90/c9ae9033ece6d38f5a164ddbd468a4f4.gif";
      const bannerGifUrl = "https://i.pinimg.com/originals/1f/73/60/1f736040a3868b98c8c4fb9146a7b955.gif";

      const ticketId = "1417021896909918218";
      const tosId = "1416786343710822550";
      const legitId = "1531985290292498453";
      const priceId = "1417913643156115598";
      
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x2f3136)
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL({ size: 128 })
        })
        .setTitle(`Welcome to ${interaction.guild.name} <:welcome:1551832028125597716>`)
        .setDescription(
          `<:Guitar:1418144145213620324> **Server tụi mình chuyên cho thuê acc Free Fire và một số dịch vụ khác nếu bạn cần** <:Guitar:1418144145213620324>,\n\n` +
          `> <#${ticketId}> : ticket support\n` +
          `> <#${tosId}> : chính sách / tos\n` +
          `> <#${legitId}> : check legit\n` +
          `> <#${priceId}> : bảng giá\n\n` +
          `*Mọi thắc mắc vui lòng liên hệ qua ADMIN để được hỗ trợ. Chúc bạn có trải nghiệm thật tốt khi tham gia sever nếu có sai sót gì hãy feedback nhé xin cảm ơn!*`
        )
        .setThumbnail(smallRightGifUrl)
        .setImage(bannerGifUrl)
        .setTimestamp();

      await (channel as any).send({
        content: `Hi ${interaction.user} chúc bạn một ngày tốt lành`,
        embeds: [welcomeEmbed]
      });

      await interaction.reply({ content: `✅ Đã gửi khung tin nhắn chào mừng mẫu vào kênh <#${welcomeChannelId}> dựa theo cấu hình Web Dashboard!`, flags: 64 });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Có lỗi xảy ra khi thực thi testwelcome!', flags: 64 });
    }
  }
};