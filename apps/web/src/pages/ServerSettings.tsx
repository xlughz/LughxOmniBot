import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ServerSettings() {
  const { id } = useParams();
  const [serverData, setServerData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'greetings' | 'embeds' | 'moderation'>('greetings');
  
  const [config, setConfig] = useState({
    prefix: '!l',
    welcomeChannelId: '',
    welcomeMessage: '',
    goodbyeChannelId: '',
    goodbyeMessage: '',
    musicEnabled: true,
    modEnabled: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`http://localhost:5000/api/servers/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServerData(data.data);
          if (data.config) setConfig(data.config);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`http://localhost:5000/api/servers/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Đã lưu cấu hình thành công vào hệ thống!');
      } else {
        setMessage('❌ Lỗi khi lưu cấu hình.');
      }
    } catch (err) {
      setMessage('❌ Không thể kết nối đến máy chủ API.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-gray-400">Đang tải cài đặt máy chủ...</div>;

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-gray-100">
      {/* Sidebar phụ chia danh mục giống Carl-bot */}
      <div className="w-64 bg-[#161b22] border-r border-gray-800 p-4 space-y-2 hidden md:block">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Cài đặt máy chủ</div>
        
        <button 
          onClick={() => setActiveTab('general')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-[#21262d] text-cyan-400 border-l-4 border-cyan-400' : 'text-gray-400 hover:bg-[#21262d]/50 hover:text-gray-200'}`}
        >
          ⚙️ Tổng quan & Prefix
        </button>
        <button 
          onClick={() => setActiveTab('greetings')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'greetings' ? 'bg-[#21262d] text-cyan-400 border-l-4 border-cyan-400' : 'text-gray-400 hover:bg-[#21262d]/50 hover:text-gray-200'}`}
        >
          👋 Chào mừng & Tạm biệt
        </button>
        <button 
          onClick={() => setActiveTab('embeds')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'embeds' ? 'bg-[#21262d] text-cyan-400 border-l-4 border-cyan-400' : 'text-gray-400 hover:bg-[#21262d]/50 hover:text-gray-200'}`}
        >
          🎨 Trình tạo Embed
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'moderation' ? 'bg-[#21262d] text-cyan-400 border-l-4 border-cyan-400' : 'text-gray-400 hover:bg-[#21262d]/50 hover:text-gray-200'}`}
        >
          🛡️ Kiểm duyệt & Tính năng
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý: {serverData?.name}</h1>
            <p className="text-sm text-gray-400">Tùy chỉnh hệ thống thông minh cho máy chủ Discord của bạn.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-5 py-2 rounded-lg shadow transition-all disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        {message && <div className="mb-6 p-4 bg-[#161b22] border border-cyan-500/50 rounded-lg text-sm">{message}</div>}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-cyan-400">Cấu hình tiền tố lệnh (Prefix)</h2>
              <p className="text-xs text-gray-400">Ký tự mở đầu để gọi các lệnh văn bản truyền thống trên server.</p>
              <input 
                type="text" 
                value={config.prefix} 
                onChange={e => setConfig({ ...config, prefix: e.target.value })}
                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* TAB 2: GREETINGS (WELCOME & GOODBYE) */}
          {activeTab === 'greetings' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-cyan-400">🎉 Kênh Chào Mừng (Welcome Channel)</h2>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">CHỌN KÊNH GỬI THÔNG BÁO</label>
                  <select 
                    value={config.welcomeChannelId} 
                    onChange={e => setConfig({ ...config, welcomeChannelId: e.target.value })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Không chọn kênh --</option>
                    {serverData?.channels?.map((ch: any) => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">NỘI DUNG TÙY CHỈNH (MÔ TẢ EMBED)</label>
                  <textarea 
                    rows={4}
                    value={config.welcomeMessage}
                    onChange={e => setConfig({ ...config, welcomeMessage: e.target.value })}
                    placeholder="Để trống để sử dụng mẫu mặc định chuyên cho thuê tài khoản Free Fire..."
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Goodbye Card */}
              <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-red-400">👋 Kênh Tạm Biệt (Goodbye Channel)</h2>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">CHỌN KÊNH THÔNG BÁO RỜI SERVER</label>
                  <select 
                    value={config.goodbyeChannelId} 
                    onChange={e => setConfig({ ...config, goodbyeChannelId: e.target.value })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Không chọn kênh --</option>
                    {serverData?.channels?.map((ch: any) => (
                      <option key={ch.id} value={ch.id}>#{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-medium">NỘI DUNG TẠM BIỆT</label>
                  <textarea 
                    rows={3}
                    value={config.goodbyeMessage}
                    onChange={e => setConfig({ ...config, goodbyeMessage: e.target.value })}
                    placeholder="Nhập thông báo khi có thành viên rời server..."
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMBEDS */}
          {activeTab === 'embeds' && (
            <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-cyan-400">🎨 Trình tạo khung nhúng (Embed Builder)</h2>
              <p className="text-sm text-gray-400">Hệ thống đang sử dụng khung Rich Embed giao diện tối ưu hóa cho Free Fire Shop với ảnh GIF nhỏ gọn và liên kết ID kênh tự động.</p>
            </div>
          )}

          {/* TAB 4: MODERATION */}
          {activeTab === 'moderation' && (
            <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-cyan-400">🛡️ Cài đặt kiểm duyệt & Tiện ích</h2>
              <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-gray-800">
                <span>Bật tính năng bảo vệ hệ thống Mod</span>
                <input 
                  type="checkbox" 
                  checked={config.modEnabled} 
                  onChange={e => setConfig({ ...config, modEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500"
                />
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}