import { useState, useEffect } from 'react';
import { Users, LayoutGrid } from 'lucide-react';

export default function Servers() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://160.191.237.229:5000/api/servers', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setServers(data.data);
      })
      .catch(err => console.error('Lỗi tải danh sách server:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-wide">Quản lý Servers</h2>
        <p className="text-sm text-muted mt-1">Danh sách chi tiết các máy chủ Discord mà bot đang hoạt động.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted animate-pulse">Đang đồng bộ dữ liệu từ Bot Cluster...</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted">
            <LayoutGrid className="w-8 h-8 mb-2 opacity-50" />
            <p>Bot chưa tham gia server nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server) => (
              <div key={server.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <img 
                  src={server.icon || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  alt={server.name} 
                  className="w-12 h-12 rounded-full border border-border bg-card shadow-sm object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-sm truncate text-text">{server.name}</h3>
                  <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                    <Users size={12} className="text-primary/70" /> 
                    {server.memberCount.toLocaleString()} thành viên
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}