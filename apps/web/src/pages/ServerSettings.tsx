import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

export default function ServerSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [config, setConfig] = useState({
    prefix: '!l',
    welcomeChannelId: '',
    musicEnabled: true,
    modEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`http://160.191.237.229:5000/api/servers/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServerInfo(data.serverData);
          if (data.config) {
            setConfig({
              prefix: data.config.prefix || '!l',
              welcomeChannelId: data.config.welcomeChannelId || '',
              musicEnabled: data.config.musicEnabled,
              modEnabled: data.config.modEnabled
            });
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://160.191.237.229:5000/api/servers/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) alert('Đã lưu cài đặt thành công!');
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu!');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-muted animate-pulse">Đang tải cấu hình máy chủ...</div>;
  if (!serverInfo) return <div className="p-6 text-red-400">Không tìm thấy dữ liệu. Bot có thể đã bị xóa khỏi server này.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard/servers')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <img src={serverInfo.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="w-10 h-10 rounded-full object-cover" alt="icon"/>
        <div>
          <h2 className="text-xl font-bold">{serverInfo.name}</h2>
          <p className="text-xs text-muted">Cấu hình máy chủ</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-2">Prefix Lệnh</label>
          <input 
            type="text" 
            value={config.prefix}
            onChange={e => setConfig({...config, prefix: e.target.value})}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary/50 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Kênh Chào Mừng</label>
          <select 
            value={config.welcomeChannelId}
            onChange={e => setConfig({...config, welcomeChannelId: e.target.value})}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:border-primary/50 outline-none transition-colors"
          >
            <option value="">-- Không gửi tin nhắn chào mừng --</option>
            {serverInfo.channels?.map((ch: any) => (
              <option key={ch.id} value={ch.id}>#{ch.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-semibold text-sm text-muted">Modules Hoạt Động</h3>
          
          <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <div>
              <div className="font-medium text-sm">Âm Nhạc (Music)</div>
              <div className="text-xs text-muted mt-1">Cho phép thành viên sử dụng hệ thống phát nhạc.</div>
            </div>
            <input type="checkbox" checked={config.musicEnabled} onChange={e => setConfig({...config, musicEnabled: e.target.checked})} className="w-5 h-5 accent-primary cursor-pointer" />
          </label>

          <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <div>
              <div className="font-medium text-sm">Kiểm Duyệt (Moderation)</div>
              <div className="text-xs text-muted mt-1">Bật các lệnh quản trị viên (ban, kick, mute, clear).</div>
            </div>
            <input type="checkbox" checked={config.modEnabled} onChange={e => setConfig({...config, modEnabled: e.target.checked})} className="w-5 h-5 accent-primary cursor-pointer" />
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}