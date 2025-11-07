import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'แดชบอร์ด', icon: '📊' },
    { path: '/transactions', label: 'บัญชี', icon: '📝' },
    { path: '/reports', label: 'รายงาน', icon: '📈' },
    { path: '/categories', label: 'หมวดหมู่', icon: '🏷️' },
    { path: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-8">เมนู</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg transition
                ${isActive(item.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
