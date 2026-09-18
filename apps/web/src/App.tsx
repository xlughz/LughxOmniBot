import ServerSettings from './pages/ServerSettings';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import BotCluster from './pages/BotCluster';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang đăng nhập (Route mặc định) */}
        <Route path="/" element={<Login />} />
        
        {/* Layout chính của trang quản lý (Dashboard) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Outlet mặc định khi vào /dashboard */}
          <Route path="bots" element={<BotCluster />} />
          <Route index element={<Dashboard />} />
          
          {/* 2. Khai báo route cho trang Servers */}
          <Route path="servers" element={<Servers />} />
          <Route path="servers/:id" element={<ServerSettings />} />
        </Route>

        {/* Nếu người dùng nhập link không tồn tại, tự động văng về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}