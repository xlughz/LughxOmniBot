import { Bot, Zap } from 'lucide-react';

export default function Login() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/discord';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Hiệu ứng Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(56,189,248,0.2)] relative z-10">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl font-bold text-text tracking-wide">
            Lughx Bot Manager
          </h1>
          <p className="text-sm text-muted font-mono">
            Manage your Discord infrastructure
          </p>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full py-3 px-4 bg-primary text-background font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group relative z-10"
        >
          <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Continue with Discord
        </button>
      </div>
    </div>
  );
}