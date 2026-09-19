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
  User
} from 'discord.js';
import { client, shoukaku, musicQueues } from '../index';

export const data = new SlashCommandBuilder()
  .setName('lplay')
  .setDescription('Mở trung tâm âm thanh số Lughx Modern Studio')
  .addStringOption(option => 
    option.setName('query')
      .setDescription('Link (YouTube / Spotify / SoundCloud) hoặc tên bài hát')
      .setRequired(false)
  );

function formatTime(ms: number) {
  if (!ms || isNaN(ms)) return '00:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
}

function createProgressBar(currentMs: number, totalMs: number, barLength = 16) {
  if (!totalMs || totalMs === 0) return '━'.repeat(barLength);
  const progress = Math.min(Math.max(currentMs / totalMs, 0), 1);
  const progressIndex = Math.round(barLength * progress);
  
  const filled = '━'.repeat(Math.max(0, progressIndex - 1));
  const empty = '─'.repeat(Math.max(0, barLength - progressIndex));
  return filled + '◉' + empty;
}

export function createMusicEmbed(track?: any, isPlaying = true, queueObj?: any) {
  const defaultIcon = 'https://cdn.discordapp.com/embed/avatars/0.png';
  const botIcon = client.user?.displayAvatarURL() || defaultIcon;

  const embed = new EmbedBuilder()
    .setColor(0x18181b)
    .setFooter({ 
      text: '✦ LUGHX SOUND SYSTEM ✦ HI-RES LAVALINK AUDIO ✦', 
      iconURL: botIcon
    });

  if (track && queueObj) {
    const currentMs = queueObj.player?.position || 0;
    const totalMs = track.length || 1;
    const progressBar = createProgressBar(currentMs, totalMs);
    const loopStatus = queueObj.loopMode === 'single' ? 'Single' : queueObj.loopMode === 'all' ? 'All' : 'Off';
    const playState = isPlaying ? '▶️ PLAYING' : '⏸️ PAUSED';
    const artistName = track.author || 'Unknown Artist';

    embed
      .setTitle('♫ 「 ' + (track.title || 'Unknown Track') + ' 」')
      .setURL(track.uri || 'https://discord.com')
      .setThumbnail(track.artworkUrl || botIcon)
      .setDescription(
        '```text\n' + progressBar + ' [' + formatTime(currentMs) + ' / ' + formatTime(totalMs) + ']\n```'
      )
      .addFields(
        { name: '✦ Artist', value: '`' + artistName + '`', inline: true },
        { name: '✦ Platform', value: '`Lavalink v4`', inline: true },
        { name: '✦ Volume', value: '`' + (queueObj.volume || 100) + '%`', inline: true },
        { name: '✦ Repeat', value: '`' + loopStatus + '`', inline: true },
        { name: '✦ Status', value: '`' + playState + '`', inline: true }
      );
  } else {
    embed
      .setTitle('𝄞 LUGHX AUDIO ENGINE')
      .setDescription(
        '```ansi\n\u001b[0;37m✦ TRẠNG THÁI: \u001b[0;32m[IDLE]\u001b[0m\nChưa có nguồn âm thanh. Nhấn [ 🔍 Nhập Nguồn ] bên dưới để bắt đầu.\n```'
      )
      .addFields(
        { name: '⟡ Hỗ Trợ Đa Nguồn', value: '`Spotify` ─ `SoundCloud` ─ `YouTube` ─ `Apple Music`', inline: false }
      );
  }

  return embed;
}

export function createMusicControls(hasPlayer = false) {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('music_add_modal')
      .setLabel('Nhập Nguồn')
      .setEmoji('🔍')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music_pause_resume')
      .setLabel('Phát / Dừng')
      .setEmoji('⏯️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPlayer),
    new ButtonBuilder()
      .setCustomId('music_skip')
      .setLabel('Bỏ Qua')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPlayer),
    new ButtonBuilder()
      .setCustomId('music_loop')
      .setLabel('Lặp')
      .setEmoji('🔁')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPlayer),
    new ButtonBuilder()
      .setCustomId('music_stop')
      .setLabel('Ngắt')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!hasPlayer)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('music_vol_down')
      .setLabel('Vol -')
      .setEmoji('🔉')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPlayer),
    new ButtonBuilder()
      .setCustomId('music_vol_up')
      .setLabel('Vol +')
      .setEmoji('🔊')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPlayer),
    new ButtonBuilder()
      .setCustomId('music_queue')
      .setLabel('Hàng Đợi')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPlayer),
    new ButtonBuilder()
      .setCustomId('music_shuffle')
      .setLabel('Trộn Bài')
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPlayer)
  );

  return [row1, row2];
}

export function createMusicModal() {
  const modal = new ModalBuilder()
    .setCustomId('music_link_modal')
    .setTitle('✦ NẠP NGUỒN ÂM THANH ✦');

  const input = new TextInputBuilder()
    .setCustomId('music_query_input')
    .setLabel('URL hoặc Tên Bài Hát')
    .setPlaceholder('https://... hoặc Tên bài hát')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  modal.addComponents(row);
  return modal;
}

// Hàm lõi xử lý phát nhạc qua Shoukaku & Lavalink v4
export async function playTrackLogic(voiceChannel: any, textChannelId: string, query: string, user: User) {
  const node = shoukaku.nodes.get('lughx-lavalink') || Array.from(shoukaku.nodes.values())[0];
  if (!node) throw new Error('Không có kết nối Lavalink Node sẵn sàng');

const isUrl = /^https?:\/\//.test(query);
  
  // Ưu tiên resolve query; nếu không phải URL thì thử ytsearch, nếu rỗng fallback sang scsearch
  let result: any = null;
  if (isUrl) {
    result = await node.rest.resolve(query);
  } else {
    result = await node.rest.resolve(`ytsearch:${query}`);
    // Nếu YouTube bị chặn hoặc rỗng dữ liệu, tự động fallback sang SoundCloud
    if (!result || result.loadType === 'empty' || result.loadType === 'error' || (Array.isArray(result.data) && result.data.length === 0)) {
      result = await node.rest.resolve(`scsearch:${query}`);
    }
  }

  if (!result || result.loadType === 'empty' || result.loadType === 'error') {
    throw new Error('Không tìm thấy bài hát yêu cầu');
  }

  let tracks: any[] = [];
  if (result.loadType === 'playlist') {
    tracks = result.data?.tracks || result.tracks || [];
  } else if (result.loadType === 'search') {
    tracks = Array.isArray(result.data) ? result.data : (result.tracks || []);
  } else if (result.loadType === 'track') {
    tracks = [result.data || result];
  }

  // Fallback kiểm tra thêm cấu trúc Lavalink v3/v4 hỗn hợp
  if (tracks.length === 0 && Array.isArray(result.data)) {
    tracks = result.data;
  }

  if (tracks.length === 0) {
    throw new Error('Không có track nào được tải về');
  }

  tracks.forEach(t => {
    if (t.info) t.info.requester = user;
  });

  let queueObj = musicQueues.get(voiceChannel.guild.id);

  if (!queueObj) {
    const player = await shoukaku.joinVoiceChannel({
      guildId: voiceChannel.guild.id,
      channelId: voiceChannel.id,
      shardId: 0,
      deaf: false,
    });

    queueObj = {
      player,
      textChannelId,
      currentTrack: null,
      queue: [],
      loopMode: 'off',
      volume: 100,
    };
    musicQueues.set(voiceChannel.guild.id, queueObj);

    player.on('end', async () => {
      const q = musicQueues.get(voiceChannel.guild.id);
      if (!q) return;

      if (q.loopMode === 'single' && q.currentTrack) {
        await q.player.playTrack({ track: { encoded: q.currentTrack.encoded } });
        return;
      }

      if (q.queue.length > 0) {
        const next = q.queue.shift();
        q.currentTrack = next;
        await q.player.playTrack({ track: { encoded: next.encoded } });

        const ch = client.channels.cache.get(q.textChannelId) as any;
        if (ch) {
          const embed = createMusicEmbed(next.info, true, q);
          const controls = createMusicControls(true);
          await ch.send({ embeds: [embed], components: controls });
        }
      } else {
        q.currentTrack = null;
        if (voiceChannel.guild.id) {
          await shoukaku.leaveVoiceChannel(voiceChannel.guild.id);
          musicQueues.delete(voiceChannel.guild.id);
        }
      }
    });

    player.on('exception', (err: any) => {
      console.error('[LAVALINK_PLAYER_EXCEPTION]', err);
    });
  }

  if (result.loadType === 'search') {
    queueObj.queue.push(tracks[0]);
  } else {
    for (const t of tracks) {
      queueObj.queue.push(t);
    }
  }

  if (!queueObj.currentTrack) {
    const first = queueObj.queue.shift();
    queueObj.currentTrack = first;
    
    // Gửi payload playTrack chuẩn Lavalink v4
    await queueObj.player.playTrack({ track: { encoded: first.encoded } });

    const ch = client.channels.cache.get(textChannelId) as any;
    if (ch) {
      const embed = createMusicEmbed(first.info, true, queueObj);
      const controls = createMusicControls(true);
      await ch.send({ embeds: [embed], components: controls });
    }
  } else {
    const ch = client.channels.cache.get(textChannelId) as any;
    if (ch) {
      const addedTrack = tracks[0];
      await ch.send('✦ Đã thêm **' + (addedTrack?.info?.title || 'bài hát') + '** vào hàng đợi!');
    }
  }
}

export async function executeSlash(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const voiceChannel = member?.voice?.channel;
  const query = interaction.options.getString('query');

  if (!query) {
    const queueObj = musicQueues.get(interaction.guildId!);
    const embed = createMusicEmbed(queueObj?.currentTrack?.info, !queueObj?.player?.paused, queueObj);
    const components = createMusicControls(!!queueObj);
    return interaction.reply({ embeds: [embed], components });
  }

  if (!voiceChannel) {
    return interaction.reply({ content: '⌁ Bạn cần tham gia một kênh Voice trước khi phát nhạc!', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });
  try {
    await playTrackLogic(voiceChannel, interaction.channelId || '', query, interaction.user);
    return interaction.editReply({ content: '✦ Đã kết nối và nạp bài hát thành công!' });
  } catch (err: any) {
    console.error('[PLAY_ERROR]', err);
    return interaction.editReply({ content: '⚠️ Lỗi phát nhạc: `' + (err.message || 'Lỗi không xác định') + '`' });
  }
}

export async function executePrefix(message: Message, args: string[]) {
  const query = args.join(' ').trim();

  if (!query) {
    const queueObj = musicQueues.get(message.guildId!);
    const embed = createMusicEmbed(queueObj?.currentTrack?.info, !queueObj?.player?.paused, queueObj);
    const components = createMusicControls(!!queueObj);
    return message.reply({ embeds: [embed], components });
  }

  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) {
    return message.reply('⌁ Bạn cần tham gia một kênh Voice trước!');
  }

  try {
    await playTrackLogic(voiceChannel, message.channelId, query, message.author);
  } catch (err: any) {
    console.error('[PLAY_ERROR]', err);
    message.reply('⚠️ Lỗi phát nhạc: `' + (err.message || 'Lỗi không xác định') + '`');
  }
}