import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, HardDrive, Activity, RefreshCw, Cpu } from 'lucide-react';

interface StatsData {
  shardStatus?: string;
  systemPing?: number;
  uptime?: number;
  botRamMB?: number;
  systemMemory?: {
    usagePercent: number;
    usedMB: number;
    totalMB: number;
  };
}

export default function BotCluster() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

const fetchStats = async () => {
  setLoading(true);
  try {
    const apiUrl = `http://${window.location.hostname}:5000/api/stats`;
    const res = await fetch(apiUrl, { credentials: 'omit' });
    const json = await res.json();
    if (json.success && json.data) {
      setStats(json.data);
    }
  } catch (err) {
    console.error('Lỗi nạp stats:', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bot Cluster Monitoring</h1>
          <p className="text-xs text-neutral-400 mt-1">Giám sát tài nguyên hệ thống VPS và tiến trình hoạt động của Bot.</p>
        </div>
        <button 
          onClick={fetchStats} 
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs transition-colors border border-neutral-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Shard Status */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-neutral-400 text-xs mb-2">
            <span>Trạng thái Shard #0</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg">
            <ShieldCheck className="w-5 h-5" />
            <span className="capitalize">{stats?.shardStatus || 'online'}</span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">Ping: {stats?.systemPing ?? 0}ms</p>
        </div>

        {/* Uptime */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-neutral-400 text-xs mb-2">
            <span>Uptime Hoạt Động</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-bold">{formatUptime(stats?.uptime)}</p>
          <p className="text-xs text-neutral-400 mt-2">Thời gian chạy không ngắt quãng</p>
        </div>

        {/* Bot RAM */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-neutral-400 text-xs mb-2">
            <span>Tiến trình Bot RAM</span>
            <HardDrive className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-bold">{stats?.botRamMB ?? 0} MB</p>
          <p className="text-xs text-neutral-400 mt-2">Node.js Heap Allocation</p>
        </div>

        {/* VPS System RAM */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-neutral-400 text-xs mb-2">
            <span className="text-xs">RAM Hệ thống VPS</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-bold">{stats?.systemMemory?.usagePercent || 0}%</p>
          <p className="text-xs text-neutral-400 mt-2">
            {stats?.systemMemory?.usedMB || 0} / {stats?.systemMemory?.totalMB || 0} MB
          </p>
        </div>
      </div>

      {/* Môi Trường Thực Thi */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Môi Trường Thực Thi</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between p-3 bg-neutral-900/80 rounded-lg border border-neutral-800/80">
            <span className="text-neutral-400">CPU Cores</span>
            <span className="font-mono">1 Cores</span>
          </div>
          <div className="flex justify-between p-3 bg-neutral-900/80 rounded-lg border border-neutral-800/80">
            <span className="text-neutral-400">CPU Model</span>
            <span className="font-mono">KVM Processor</span>
          </div>
          <div className="flex justify-between p-3 bg-neutral-900/80 rounded-lg border border-neutral-800/80">
            <span className="text-neutral-400">Node.js Version</span>
            <span className="font-mono text-cyan-400">v22.x</span>
          </div>
          <div className="flex justify-between p-3 bg-neutral-900/80 rounded-lg border border-neutral-800/80">
            <span className="text-neutral-400">Discord.js Version</span>
            <span className="font-mono text-indigo-400">v14.x</span>
          </div>
        </div>
      </div>
    </div>
  );
}