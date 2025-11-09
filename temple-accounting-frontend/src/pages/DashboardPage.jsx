import { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import api from '../services/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get(`/reports/summary?month=${currentMonth}`);
        setSummary(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [currentMonth]);

  if (loading) return <div className="text-center py-8">กำลังโหลด...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">แดชบอร์ด</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 mb-2">รายรับรวม</p>
            <p className="text-3xl font-bold text-success-600">
              {summary?.total_income.toFixed(2) || '0.00'} บาท
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 mb-2">รายจ่ายรวม</p>
            <p className="text-3xl font-bold text-danger-600">
              {summary?.total_expense.toFixed(2) || '0.00'} บาท
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 mb-2">คงเหลือ</p>
            <p className={`text-3xl font-bold ${summary?.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {summary?.balance.toFixed(2) || '0.00'} บาท
            </p>
          </div>
        </Card>
      </div>

      {summary?.by_category && summary.by_category.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold mb-4">รายรับ-รายจ่ายตามหมวดหมู่</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">หมวดหมู่</th>
                  <th className="px-4 py-2 text-left">ประเภท</th>
                  <th className="px-4 py-2 text-right">จำนวน</th>
                  <th className="px-4 py-2 text-right">ครั้ง</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_category.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        item.type === 'income' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                      }`}>
                        {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{parseFloat(item.total).toFixed(2)} บาท</td>
                    <td className="px-4 py-2 text-right">{item.count}</td>
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
