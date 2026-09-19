import { useState, useEffect } from 'react';
import { User, Shield, Terminal, Bell, CheckCircle2, AlertTriangle } from 'lucide-react';

const API_BASE_URL = 'http://160.191.237.229:3000';

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-wide">Cài Đặt Hệ Thống</h2>
        <p className="text-sm text-muted mt-1">Quản lý hồ sơ quản trị viên và cấu hình thông báo vận hành.</p>
      </div>

      {/* Thông tin tài khoản đăng nhập */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted flex items-center gap-2">
          <User size={16} /> Hồ Sơ Discord
        </h3>
        
        <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background/50">
          <img 
            src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
            alt="Avatar" 
            className="w-14 h-14 rounded-full border border-border bg-card object-cover"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">{user?.username || 'Chưa đăng nhập'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
                {user?.role || 'VIEWER'}
              </span>
            </div>
            <p className="text-xs text-muted font-mono">Discord ID: {user?.discordId || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Cấu hình Thông báo & Webhook */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted flex items-center gap-2">
          <Bell size={16} /> Kênh Nhận Cảnh Báo Lỗi (Discord Webhook)
        </h3>
        
        <form onSubmit={handleSaveWebhook} className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-2">
              Webhook URL (Bot sẽ gửi thông báo vào đây khi phát hiện lỗi hoặc reboot):
            </label>
            <input 
              type="text"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              {saved && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Đã cập nhật cấu hình webhook!
                </span>
              )}
            </div>
            <button 
              type="submit"
              className="bg-white text-black px-5 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Lưu Cấu Hình
            </button>
          </div>
        </form>
      </div>

      {/* Vùng Thao Tác Hệ Thống */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
          <Shield size={16} /> Vùng Điều Khiển Nâng Cao
        </h3>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-background/50 gap-4">
          <div>
            <div className="font-medium text-sm">Làm mới bộ nhớ đệm (Flush Cache)</div>
            <div className="text-xs text-muted mt-1">Xóa toàn bộ cache tạm thời của các shard để giải phóng RAM.</div>
          </div>
          <button 
            onClick={() => alert('Đã gửi yêu cầu giải phóng cache!')}
            className="px-4 py-2 rounded-lg border border-border bg-card text-xs font-medium hover:bg-white/10 transition-colors self-start sm:self-auto"
          >
            Giải Phóng Cache
          </button>
        </div>
      </div>
    </div>
  );
}