import { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import api from '../services/api';

export default function ReportPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [format, setFormat] = useState('summary');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = format === 'summary' ? '/reports/summary' : '/reports/detailed';
      const response = await api.get(`${endpoint}?month=${month}`);
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/export-${type}?month=${month}&format=${format}`, {
        responseType: type === 'pdf' ? 'blob' : 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${month}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">รายงานบัญชี</h1>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <Card className="mb-8">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-2">เลือกเดือน</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">รูปแบบรายงาน</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="summary">สรุป</option>
                <option value="detailed">ย่อยละเอียด</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                {loading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {report && (
        <>
          <Card className="mb-8">
            <h2 className="text-xl font-bold mb-4">สรุปบัญชี ({month})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-success-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">รายรับรวม</p>
                <p className="text-2xl font-bold text-success-600">
                  {parseFloat(report.total_income || report.summary?.total_income).toFixed(2)} บาท
                </p>
              </div>
              <div className="bg-danger-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">รายจ่ายรวม</p>
                <p className="text-2xl font-bold text-danger-600">
                  {parseFloat(report.total_expense || report.summary?.total_expense).toFixed(2)} บาท
                </p>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">คงเหลือ</p>
                <p className="text-2xl font-bold text-primary-600">
                  {parseFloat(
                    report.balance || (report.summary?.total_income - report.summary?.total_expense)
                  ).toFixed(2)} บาท
                </p>
              </div>
            </div>

            {/* Summary by Category */}
            {report.by_category && (
              <div className="mt-6">
                <h3 className="font-bold mb-3">รายรับ-รายจ่ายตามหมวดหมู่</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">หมวดหมู่</th>
                        <th className="px-4 py-2 text-left">ประเภท</th>
                        <th className="px-4 py-2 text-right">จำนวน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.by_category.map((cat) => (
                        <tr key={cat.id} className="border-t">
                          <td className="px-4 py-2">{cat.name}</td>
                          <td className="px-4 py-2">
                            {cat.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {parseFloat(cat.total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Transactions */}
            {report.transactions && report.transactions.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold mb-3">รายการละเอียด</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">วันที่</th>
                        <th className="px-4 py-2 text-left">หมวดหมู่</th>
                        <th className="px-4 py-2 text-left">คำอธิบาย</th>
                        <th className="px-4 py-2 text-right">จำนวน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.transactions.map((trans) => (
                        <tr key={trans.id} className="border-t">
                          <td className="px-4 py-2">{trans.date}</td>
                          <td className="px-4 py-2">{trans.category_name}</td>
                          <td className="px-4 py-2">{trans.description || '-'}</td>
                          <td className="px-4 py-2 text-right">
                            {parseFloat(trans.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex gap-4">
              <Button onClick={() => handleExport('pdf')} disabled={loading}>
                📥 ส่งออก PDF
              </Button>
              <Button onClick={() => handleExport('excel')} disabled={loading} variant="secondary">
                📥 ส่งออก Excel
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
