import { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import api from '../services/api';

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    type: 'income',
    category_id: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    details: '',
  });

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, catRes] = await Promise.all([
        api.get(`/transactions?month=${month}`),
        api.get('/categories'),
      ]);
      setTransactions(transRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
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
        await api.put(`/transactions/${editingId}`, formData);
        setSuccess('อัปเดตรายการสำเร็จ');
      } else {
        await api.post('/transactions', formData);
        setSuccess('เพิ่มรายการสำเร็จ');
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบ?')) {
      try {
        await api.delete(`/transactions/${id}`);
        setSuccess('ลบรายการสำเร็จ');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete transaction');
      }
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      type: transaction.type,
      category_id: transaction.category_id,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description || '',
      details: transaction.details || '',
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      category_id: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
      details: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="text-center py-8">กำลังโหลด...</div>;

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">บัญชีรายรับ-รายจ่าย</h1>
        <Button onClick={() => setShowForm(true)}>+ เพิ่มรายการ</Button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      )}

      <Card className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <label className="font-medium">เดือน:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="border rounded px-3 py-2"
              >
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
              </select>

              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="border rounded px-3 py-2"
                required
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="จำนวนเงิน"
                step="0.01"
                required
              />

              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />

              <Input
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="คำอธิบาย"
              />

              <Input
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="primary">
                {editingId ? 'อัปเดต' : 'บันทึก'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                ยกเลิก
              </Button>
            </div>
          </form>
        )}
      </Card>

      {transactions.length === 0 ? (
        <Card>
          <div className="text-center text-gray-500 py-8">
            ไม่มีรายการ
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">วันที่</th>
                  <th className="px-4 py-2 text-left">ประเภท</th>
                  <th className="px-4 py-2 text-left">หมวดหมู่</th>
                  <th className="px-4 py-2 text-right">จำนวน</th>
                  <th className="px-4 py-2 text-left">คำอธิบาย</th>
                  <th className="px-4 py-2 text-center">การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trans) => (
                  <tr key={trans.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{trans.date}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        trans.type === 'income' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                      }`}>
                        {trans.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{trans.category_name}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {parseFloat(trans.amount).toFixed(2)} บาท
                    </td>
                    <td className="px-4 py-2 text-sm">{trans.description || '-'}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleEdit(trans)}
                        className="text-primary-600 hover:text-primary-700 mr-2"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(trans.id)}
                        className="text-danger-600 hover:text-danger-700"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
