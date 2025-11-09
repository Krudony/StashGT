import { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import api from '../services/api';

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { name: formData.name });
        setSuccess('อัปเดตหมวดหมู่สำเร็จ');
      } else {
        await api.post('/categories', formData);
        setSuccess('เพิ่มหมวดหมู่สำเร็จ');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบ?')) {
      try {
        await api.delete(`/categories/${id}`);
        setSuccess('ลบหมวดหมู่สำเร็จ');
        fetchCategories();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete category');
      }
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'expense' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="text-center py-8">กำลังโหลด...</div>;

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">จัดการหมวดหมู่</h1>
        <Button onClick={() => setShowForm(true)}>+ เพิ่มหมวดหมู่</Button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      )}

      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="ชื่อหมวดหมู่"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ชื่อหมวดหมู่"
              required
              disabled={editingId !== null} // Cannot edit default categories
            />

            <div>
              <label className="block font-medium mb-2">ประเภท</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={editingId !== null}
                className="w-full border rounded px-3 py-2"
              >
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? 'อัปเดต' : 'เพิ่ม'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Income Categories */}
        <Card>
          <h2 className="text-xl font-bold mb-4">หมวดหมู่รายรับ</h2>
          {incomeCategories.length === 0 ? (
            <p className="text-gray-500">ไม่มีหมวดหมู่</p>
          ) : (
            <div className="space-y-2">
              {incomeCategories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{cat.name}</span>
                  <div className="flex gap-2">
                    {!cat.is_default && (
                      <>
                        <button
                          onClick={() => handleEdit(cat)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-danger-600 hover:text-danger-700 text-sm"
                        >
                          ลบ
                        </button>
                      </>
                    )}
                    {cat.is_default && (
                      <span className="text-gray-500 text-xs">พื้นฐาน</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Expense Categories */}
        <Card>
          <h2 className="text-xl font-bold mb-4">หมวดหมู่รายจ่าย</h2>
          {expenseCategories.length === 0 ? (
            <p className="text-gray-500">ไม่มีหมวดหมู่</p>
          ) : (
            <div className="space-y-2">
              {expenseCategories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{cat.name}</span>
                  <div className="flex gap-2">
                    {!cat.is_default && (
                      <>
                        <button
                          onClick={() => handleEdit(cat)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-danger-600 hover:text-danger-700 text-sm"
                        >
                          ลบ
                        </button>
                      </>
                    )}
                    {cat.is_default && (
                      <span className="text-gray-500 text-xs">พื้นฐาน</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
