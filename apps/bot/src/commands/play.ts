import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  Message, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  GuildMember,
  PermissionsBitField
} from 'discord.js';
import { 
  joinVoiceChannel, 
  VoiceConnectionStatus, 
  entersState,
  getVoiceConnection
} from '@discordjs/voice';

export const data = new SlashCommandBuilder()
  .setName('lplay')
  .setDescription('Mở trung tâm âm thanh số Lughx Modern Studio')
  .addStringOption(option => 
    option.setName('query')
      .setDescription('Link (YouTube / Spotify / SoundCloud) hoặc tên bài hát')
      .setRequired(false)
  );

// Thanh tiến trình Minimalist dạng typography phẳng
function createProgressBar(currentSeconds: number, totalSeconds: number, barLength = 16) {
  if (!totalSeconds || totalSeconds === 0) return '━'.repeat(barLength);
  const progress = Math.min(Math.max(currentSeconds / totalSeconds, 0), 1);
  const progressIndex = Math.round(barLength * progress);
  
  const filled = '━'.repeat(Math.max(0, progressIndex - 1));
  const empty = '─'.repeat(Math.max(0, barLength - progressIndex));
  return `${filled}◉${empty}`;
}

// Embed giao diện điều khiển Minimal Premium
export function createMusicEmbed(song?: any, isPlaying = true, queue?: any) {
  const embed = new EmbedBuilder()
    .setColor(0x18181b)
    .setFooter({ 
      text: '✦ LUGHX SOUND SYSTEM ✦ HI-RES AUDIO ✦', 
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png' 
    });

  if (song && queue) {
    const currentSec = queue.currentTime || 0;
    const totalSec = song.duration || 1;
    const progressBar = createProgressBar(currentSec, totalSec);
    const loopStatus = queue.repeatMode === 1 ? '𝄪 Single' : queue.repeatMode === 2 ? '𝄪 All' : 'Off';
    const playState = isPlaying ? '⏵ PLAYING' : '⏸ PAUSED';
    const sourceName = (song.source || 'WEB').toUpperCase();
    const artistName = song.uploader?.name || song.uploader || 'Unknown Artist';

    embed
      .setTitle(`♫ 「 ${song.name || 'Unknown Track'} 」`)
      .setURL(song.url || 'https://discord.com')
      .setThumbnail(song.thumbnail || 'https://cdn.discordapp.com/embed/avatars/0.png')
      .setDescription(
        `\`\`\`text\n${progressBar} [${queue.formattedCurrentTime || '00:00'} / ${song.formattedDuration || '00:00'}]\`\`\``
      )
      .addFields(
        { name: '✦ Artist', value: `\`${artistName}\``, inline: true },
        { name: '✦ Request', value: `${song.user || 'Unknown'}`, inline: true },
        { name: '✦ Platform', value: `\`${sourceName}\``, inline: true },
        { name: '✦ Volume', value: `\`${queue.volume || 100}%\``, inline: true },
        { name: '✦ Repeat', value: `\`${loopStatus}\``, inline: true },
        { name: '✦ Status', value: `\`${playState}\``, inline: true }
      );
  } else {
    embed
      .setTitle('𝄞 LUGHX AUDIO ENGINE')
      .setDescription(
        '```ansi\n\u001b[0;37m✦ TRẠNG THÁI: \u001b[0;32m[IDLE]\u001b[0m\nChưa có nguồn âm thanh. Nhấn [ ⌕ Nhập Nguồn ] bên dưới để bắt đầu.\n```'
      )
      .addFields(
        { name: '⟡ Hỗ Trợ Đa Nguồn', value: '`Spotify` ─ `SoundCloud` ─ `YouTube` ─ `Apple Music`', inline: false }
      );
  }

  return embed;
}

// Bộ nút bấm điều khiển
export function createMusicControls(hasQueue = false) {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('music_add_modal')
      .setLabel('Nhập Nguồn')
      .setEmoji('⌕')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music_pause_resume')
      .setLabel('Phát / Dừng')
      .setEmoji('⏯')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasQueue),
    new ButtonBuilder()
      .setCustomId('music_skip')
      .setLabel('Bỏ Qua')
      .setEmoji('⏭')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasQueue),
    new ButtonBuilder()
      .setCustomId('music_loop')
      .setLabel('Lặp')
      .setEmoji('𝄪')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasQueue),
    new ButtonBuilder()
      .setCustomId('music_stop')
      .setLabel('Ngắt')
      .setEmoji('⏹')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!hasQueue)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('music_vol_down')
      .setLabel('Vol -')
      .setEmoji('◁')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasQueue),
    new ButtonBuilder()
      .setCustomId('music_vol_up')
      .setLabel('Vol +')
      .setEmoji('▷')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasQueue),
    new ButtonBuilder()
      .setCustomId('music_queue')
      .setLabel('Hàng Đợi')
      .setEmoji('✦')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasQueue),
    new ButtonBuilder()
      .setCustomId('music_shuffle')
      .setLabel('Trộn Bài')
      .setEmoji('𖦹')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasQueue)
  );

  return [row1, row2];
}

// Popup Modal nhập link hoặc từ khóa
export function createMusicModal() {
  const modal = new ModalBuilder()
    .setCustomId('music_link_modal')
    .setTitle('✦ NẠP NGUỒN ÂM THANH ✦');

  const input = new TextInputBuilder()
    .setCustomId('music_query_input')
    .setLabel('URL (Spotify / YT / SoundCloud) hoặc Tên Bài Hát')
    .setPlaceholder('Ví dụ: https://open.spotify.com/... hoặc Tên bài hát')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  modal.addComponents(row);
  return modal;
}

// Helper: Đảm bảo kết nối Voice an toàn và chủ động bắt tay
async function ensureVoiceConnection(voiceChannel: any) {
  let connection = getVoiceConnection(voiceChannel.guild.id);
  
  if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
      selfDeaf: true,
    });
  }

  // Chờ tối đa 15 giây để trạng thái kết nối chuyển sang Ready
  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  return connection;
}

// Thực thi Slash Command /lplay
export async function executeSlash(interaction: ChatInputCommandInteraction, distube: any) {
  const member = interaction.member as GuildMember;
  const voiceChannel = member?.voice?.channel;
  const query = interaction.options.getString('query');

  // Không có query -> Chỉ hiển thị controller, không kết nối voice
  if (!query) {
    const queue = distube.getQueue(interaction.guildId!);
    const currentTrack = queue?.songs[0];
    const embed = createMusicEmbed(currentTrack, queue?.playing, queue);
    const components = createMusicControls(!!queue);

    return interaction.reply({ embeds: [embed], components });
  }

  // Có query -> Kiểm tra kênh thoại
  if (!voiceChannel) {
    return interaction.reply({ 
      content: '⌁ Bạn cần tham gia một kênh Voice trước khi phát nhạc!', 
      ephemeral: true 
    });
  }

  // Kiểm tra quyền của Bot trong Voice Channel
  const botMember = interaction.guild?.members.me;
  if (botMember && !voiceChannel.permissionsFor(botMember).has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) {
    return interaction.reply({
      content: '⚠️ Bot thiếu quyền **Connect** hoặc **Speak** trong kênh thoại này!',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  try {
    // 1. Chủ động bắt tay với Discord Voice Gateway
    await ensureVoiceConnection(voiceChannel);

    // 2. Chuyển kênh cho DisTube play
    await distube.play(voiceChannel, query, {
      member: member,
      textChannel: interaction.channel as any,
    });

    return interaction.deleteReply().catch(() => null);
  } catch (err: any) {
    console.error('[PLAY_ERROR]', err);
    return interaction.editReply({ 
      content: `⚠️ Lỗi phát nhạc: \`${err.message || 'Không thể kết nối kênh voice'}\`` 
    });
  }
}

// Thực thi Prefix Command !lplay
export async function executePrefix(message: Message, distube: any, args: string[]) {
  const query = args.join(' ').trim();

  // Không có query -> Gửi controller
  if (!query) {
    const queue = distube.getQueue(message.guildId!);
    const currentTrack = queue?.songs[0];
    const embed = createMusicEmbed(currentTrack, queue?.playing, queue);
    const components = createMusicControls(!!queue);
    return message.reply({ embeds: [embed], components });
  }

  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) {
    return message.reply('⌁ Bạn cần tham gia một kênh Voice trước!');
  }

  const botMember = message.guild?.members.me;
  if (botMember && !voiceChannel.permissionsFor(botMember).has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) {
    return message.reply('⚠️ Bot thiếu quyền **Connect** hoặc **Speak** trong kênh thoại này!');
  }

  try {
    // 1. Chủ động bắt tay Voice Gateway
    await ensureVoiceConnection(voiceChannel);

    // 2. Chuyển DisTube phát nhạc
    await distube.play(voiceChannel, query, {
      member: message.member,
      textChannel: message.channel as any,
    });
  } catch (err: any) {
    console.error('[PLAY_ERROR]', err);
    message.reply(`⚠️ Lỗi phát nhạc: \`${err.message || 'Không thể kết nối kênh voice'}\``);
  }
}