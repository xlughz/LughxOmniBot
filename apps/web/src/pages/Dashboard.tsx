import { useState, useEffect } from 'react';
import { Bot, Server, Users, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBots: 0,
    activeServers: 0,
    totalUsers: 0,
    systemPing: 0
  });

  useEffect(() => {
    // Gọi API lấy số liệu hệ thống
    fetch('http://160.191.237.229:5000/api/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setStats(resData.data);
        }
      })
      .catch(err => console.error('Lỗi lấy thống kê:', err));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Overview</h1>
        <p className="text-sm text-muted">Trạng thái thời gian thực của Lughx Cluster.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cột 1: Total Bots */}
        <div className="bg-card border border-border p-5 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-sm text-muted mb-1">Total Bots</p>
            <p className="text-2xl font-bold">{stats.totalBots}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Bot size={20} />
          </div>
        </div>

        {/* Cột 2: Active Servers */}
        <div className="bg-card border border-border p-5 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-sm text-muted mb-1">Active Servers</p>
            <p className="text-2xl font-bold">{stats.activeServers}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
            <Server size={20} />
          </div>
        </div>

        {/* Cột 3: Total Users */}
        <div className="bg-card border border-border p-5 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-sm text-muted mb-1">Total Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Users size={20} />
          </div>
        </div>

        {/* Cột 4: System Ping */}
        <div className="bg-card border border-border p-5 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-sm text-muted mb-1">System Ping</p>
            <p className="text-2xl font-bold">{stats.systemPing}ms</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Phần Activity Chart giữ nguyên như cũ */}
      <div className="bg-card border border-border rounded-xl h-64 flex items-center justify-center text-muted font-mono text-sm">
        [ Activity Chart Placeholder ]
      </div>
    </div>
  );
}