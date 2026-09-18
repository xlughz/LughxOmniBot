import { Activity, Users, Server, Zap } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Total Bots', value: '3', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active Servers', value: '124', icon: Server, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Total Users', value: '45.2K', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'System Ping', value: '42ms', icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-wide">System Overview</h2>
        <p className="text-sm text-muted mt-1">Trạng thái thời gian thực của Lughx Cluster.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted font-medium">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder cho Biểu đồ / Activity Log */}
      <div className="bg-card border border-border rounded-xl p-6 min-h-[300px] flex items-center justify-center">
        <p className="text-muted font-mono text-sm">[ Activity Chart Placeholder ]</p>
      </div>
    </div>
  );
}