import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, // Thay CommandInteraction bằng ChatInputCommandInteraction
  Message, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  GuildMember
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('lplay')
  .setDescription('Mở trung tâm âm thanh số Lughx Modern Studio')
  .addStringOption(option => 
    option.setName('query')
      .setDescription('Link (YouTube / Spotify / SoundCloud) hoặc tên bài hát')
      .setRequired(false)
  );

// Thanh tiến trình Minimalist
function createProgressBar(currentSeconds: number, totalSeconds: number, barLength = 16) {
  if (!totalSeconds || totalSeconds === 0) return '━'.repeat(barLength);
  const progress = Math.min(Math.max(currentSeconds / totalSeconds, 0), 1);
  const progressIndex = Math.round(barLength * progress);
  
  const filled = '━'.repeat(Math.max(0, progressIndex - 1));
  const empty = '─'.repeat(Math.max(0, barLength - progressIndex));
  return `${filled}◉${empty}`;
}

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

    embed
      .setTitle(`♫ 「 ${song.name} 」`)
      .setURL(song.url)
      .setThumbnail(song.thumbnail || 'https://cdn.discordapp.com/embed/avatars/0.png')
      .setDescription(
        `\`\`\`text\n${progressBar} [${queue.formattedCurrentTime || '00:00'} / ${song.formattedDuration}]\`\`\``
      )
      .addFields(
        { name: '✦ Artist', value: `\`${song.uploader?.name || 'Unknown'}\``, inline: true },
        { name: '✦ Request', value: `${song.user}`, inline: true },
        { name: '✦ Platform', value: `\`${(song.source || 'WEB').toUpperCase()}\``, inline: true },
        { name: '✦ Volume', value: `\`${queue.volume}%\``, inline: true },
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

export function createMusicModal() {
  const modal = new ModalBuilder()
    .setCustomId('music_link_modal')
    .setTitle('✦ NẠP NGUỒN ÂM THANH ✦');

  const input = new TextInputBuilder()
    .setCustomId('music_query_input')
    .setLabel('URL (Spotify / YT / SoundCloud) hoặc Tên Bài Hát')
    .setPlaceholder('Ví dụ: https://open.spotify.com/... hoặc Vũ - Lạ Lùng')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  modal.addComponents(row);
  return modal;
}

export async function executeSlash(interaction: ChatInputCommandInteraction, distube: any) {
  const member = interaction.member as GuildMember;
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply({ content: '⌁ Bạn cần tham gia một kênh Voice trước!', ephemeral: true });
  }

  const query = interaction.options.getString('query');

  if (query) {
    await interaction.deferReply();
    await distube.play(voiceChannel, query, {
      member: member,
      textChannel: interaction.channel,
    });
    return interaction.deleteReply().catch(() => null);
  }

  const queue = distube.getQueue(interaction.guildId!);
  const currentTrack = queue?.songs[0];
  const embed = createMusicEmbed(currentTrack, queue?.playing, queue);
  const components = createMusicControls(!!queue);

  await interaction.reply({ embeds: [embed], components });
}

export async function executePrefix(message: Message, distube: any, args: string[]) {
  const voiceChannel = message.member?.voice?.channel;

  if (!voiceChannel) {
    return message.reply('⌁ Bạn cần tham gia một kênh Voice trước!');
  }

  const query = args.join(' ');
  if (query) {
    await distube.play(voiceChannel, query, {
      member: message.member,
      textChannel: message.channel,
    });
    return;
  }

  const queue = distube.getQueue(message.guildId!);
  const currentTrack = queue?.songs[0];
  const embed = createMusicEmbed(currentTrack, queue?.playing, queue);
  const components = createMusicControls(!!queue);

  await message.reply({ embeds: [embed], components });
}