import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">
              Temple Accounting
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.temple_name}</p>
                  <p className="text-gray-500">{user.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  ออกจากระบบ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
