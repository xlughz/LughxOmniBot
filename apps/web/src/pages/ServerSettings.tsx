import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

interface ChannelItem {
  id: string;
  name: string;
  position?: number;
}

interface ServerInfo {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  channelsCount?: number;
  rolesCount?: number;
  channels?: ChannelItem[];
}

export default function ServerSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [config, setConfig] = useState({
    prefix: '!l',
    welcomeChannelId: '',
    musicEnabled: false,
    modEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/servers/${id}`, { credentials: 'omit' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServerInfo(data.serverData || data.data);
          if (data.config) {
            setConfig({
              prefix: data.config.prefix || '!l',
              welcomeChannelId: data.config.welcomeChannelId || '',
              musicEnabled: data.config.musicEnabled ?? false,
              modEnabled: data.config.modEnabled ?? true,
            });
          }
        }
      })
      .catch(err => console.error('Lỗi khi nạp dữ liệu máy chủ:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/servers/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã lưu cấu hình máy chủ thành công!');
      } else {
        alert('Lưu cấu hình thất bại: ' + (data.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi gửi yêu cầu lưu cài đặt!');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-6 text-neutral-400 animate-pulse">Đang tải cấu hình máy chủ...</div>;
  }

  if (!serverInfo) {
    return <div className="p-6 text-red-400">Không tìm thấy dữ liệu. Bot có thể đã bị xóa khỏi server này.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto text-white">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/servers')}
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-300" />
        </button>
        {serverInfo.icon ? (
          <img
            src={serverInfo.icon}
            alt={serverInfo.name}
            className="w-12 h-12 rounded-full border border-neutral-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-lg">
            {serverInfo.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">{serverInfo.name}</h1>
          <p className="text-xs text-neutral-400">Cấu hình máy chủ • {serverInfo.memberCount} thành viên</p>
        </div>
      </div>

      {/* Form cấu hình */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 space-y-6">
        {/* Prefix Lệnh */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Prefix Lệnh</label>
          <input
            type="text"
            value={config.prefix}
            onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 font-mono"
            placeholder="!l"
          />
        </div>

        {/* Kênh Chào Mừng */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Kênh Chào Mừng</label>
          <select
            value={config.welcomeChannelId}
            onChange={(e) => setConfig({ ...config, welcomeChannelId: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- Không gửi tin nhắn chào mừng --</option>
            {serverInfo.channels && serverInfo.channels.length > 0 ? (
              serverInfo.channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name}
                </option>
              ))
            ) : (
              <option disabled value="none">
                (Không tìm thấy kênh văn bản khả dụng)
              </option>
            )}
          </select>
        </div>

        {/* Modules Hoạt Động */}
        <div className="space-y-4 pt-2 border-t border-neutral-800/80">
          <label className="block text-sm font-medium text-neutral-300">Modules Hoạt Động</label>
          
          <div className="flex items-center justify-between p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800">
            <div>
              <p className="text-sm font-medium text-neutral-200">Âm Nhạc (Music)</p>
              <p className="text-xs text-neutral-400">Cho phép thành viên sử dụng hệ thống phát nhạc.</p>
            </div>
            <input
              type="checkbox"
              checked={config.musicEnabled}
              onChange={(e) => setConfig({ ...config, musicEnabled: e.target.checked })}
              className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-cyan-600 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-neutral-950/60 rounded-lg border border-neutral-800">
            <div>
              <p className="text-sm font-medium text-neutral-200">Kiểm Duyệt (Moderation)</p>
              <p className="text-xs text-neutral-400">Bật các lệnh quản trị viên (ban, kick, mute, clear).</p>
            </div>
            <input
              type="checkbox"
              checked={config.modEnabled}
              onChange={(e) => setConfig({ ...config, modEnabled: e.target.checked })}
              className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-cyan-600 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Nút lưu */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}