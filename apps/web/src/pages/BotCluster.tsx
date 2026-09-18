import { useState, useEffect } from 'react';
import { Cpu, HardDrive, Clock, Activity, ShieldCheck, RefreshCw } from 'lucide-react';

export default function BotCluster() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchClusterStats = () => {
    setLoading(true);
    fetch('http://160.191.237.229:5000/api/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      })
      .catch(err => console.error('Lỗi tải cluster stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClusterStats();
    const interval = setInterval(fetchClusterStats, 10000); // Tự động cập nhật mỗi 10s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
  };

  if (loading && !stats) {
    return <div className="p-6 text-muted animate-pulse">Đang kết nối tới Lughx Bot Cluster...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">Bot Cluster Monitoring</h2>
          <p className="text-sm text-muted mt-1">Giám sát tài nguyên hệ thống VPS và tiến trình hoạt động của Bot.</p>
        </div>
        <button 
          onClick={fetchClusterStats}
          className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg border border-border transition-colors text-muted hover:text-text"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Thông số tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Trạng thái Shard #0</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-xl font-bold mt-2 text-emerald-400 flex items-center gap-2">
            <ShieldCheck size={20} />
            {stats?.status || 'Online'}
          </div>
          <p className="text-xs text-muted mt-2">Ping: {stats?.systemPing ?? 0}ms</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs">Uptime Hoạt Động</span>
            <Clock size={16} />
          </div>
          <div className="text-xl font-bold mt-2 text-text">
            {formatUptime(stats?.uptime)}
          </div>
          <p className="text-xs text-muted mt-2">Thời gian chạy không ngắt quãng</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs">Tiến trình Bot RAM</span>
            <HardDrive size={16} />
          </div>
          <div className="text-xl font-bold mt-2 text-text">
            {stats?.botMemoryMB || 0} MB
          </div>
          <p className="text-xs text-muted mt-2">Node.js Heap Allocation</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs">RAM Hệ thống VPS</span>
            <Activity size={16} />
          </div>
          <div className="text-xl font-bold mt-2 text-text">
            {stats?.systemMemory?.usagePercent || 0}%
          </div>
          <p className="text-xs text-muted mt-2">
            {stats?.systemMemory?.usedMB || 0} / {stats?.systemMemory?.totalMB || 0} MB
          </p>
        </div>
      </div>

      {/* Thông tin phần cứng & runtime */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Cpu size={18} className="text-primary" />
          Môi Trường Thực Thi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between p-3.5 rounded-lg border border-border bg-background/50">
            <span className="text-muted">CPU Cores</span>
            <span className="font-mono font-medium">{stats?.cpuCores || 1} Cores</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-lg border border-border bg-background/50">
            <span className="text-muted">CPU Model</span>
            <span className="font-mono font-medium truncate max-w-[200px]">{stats?.cpuModel || 'KVM Processor'}</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-lg border border-border bg-background/50">
            <span className="text-muted">Node.js Version</span>
            <span className="font-mono font-medium text-primary">{stats?.nodeVersion || 'v20.x'}</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-lg border border-border bg-background/50">
            <span className="text-muted">Discord.js Version</span>
            <span className="font-mono font-medium text-indigo-400">{stats?.discordJsVersion || 'v14.x'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}