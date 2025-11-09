import { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    // TODO: Implement password change API
    setSuccess('เปลี่ยนรหัสผ่านสำเร็จ');
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ตั้งค่า</h1>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      )}

      {/* Profile Information */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold mb-6">ข้อมูลโปรไฟล์</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้ใช้
            </label>
            <p className="text-gray-900">{user?.username}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <p className="text-gray-900">{user?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อวัด
            </label>
            <p className="text-gray-900">{user?.temple_name}</p>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold mb-6">เปลี่ยนรหัสผ่าน</h2>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            label="รหัสผ่านปัจจุบัน"
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="รหัสผ่านปัจจุบัน"
            required
          />

          <Input
            label="รหัสผ่านใหม่"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="รหัสผ่านใหม่"
            required
          />

          <Input
            label="ยืนยันรหัสผ่านใหม่"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="ยืนยันรหัสผ่านใหม่"
            required
          />

          <Button type="submit">เปลี่ยนรหัสผ่าน</Button>
        </form>
      </Card>

      {/* Notification Settings */}
      <Card>
        <h2 className="text-xl font-bold mb-6">ตั้งค่าแจ้งเตือน</h2>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span>แจ้งเตือนสิ้นเดือน</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span>แจ้งเตือนเมื่อรายจ่ายเกินงบประมาณ</span>
          </label>

          <div className="mt-6">
            <Button>บันทึกตั้งค่า</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
