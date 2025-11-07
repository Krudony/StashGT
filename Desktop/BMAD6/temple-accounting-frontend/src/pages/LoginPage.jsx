import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import Card from '../components/common/Card';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    temple_name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      if (isRegister) {
        await register(formData.username, formData.email, formData.password, formData.temple_name);
        setIsRegister(false);
        setFormData({ username: '', password: '', email: '', temple_name: '' });
      } else {
        await login(formData.username, formData.password);
        navigate('/');
      }
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            Temple Accounting
          </h1>
          <p className="text-gray-600">จัดการบัญชีเงินวัด</p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <Input
            label="ชื่อผู้ใช้"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="ชื่อผู้ใช้"
            required
          />

          {isRegister && (
            <>
              <Input
                label="อีเมล"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="อีเมล"
                required
              />
              <Input
                label="ชื่อวัด"
                name="temple_name"
                value={formData.temple_name}
                onChange={handleChange}
                placeholder="ชื่อวัด"
                required
              />
            </>
          )}

          <Input
            label="รหัสผ่าน"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="รหัสผ่าน"
            required
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? 'กำลังดำเนินการ...'
              : isRegister
              ? 'สมัครสมาชิก'
              : 'เข้าสู่ระบบ'
            }
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                clearError();
                setFormData({ username: '', password: '', email: '', temple_name: '' });
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
