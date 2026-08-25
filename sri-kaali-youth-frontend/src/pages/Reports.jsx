import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Award,
  DollarSign,
  PieChart as PieChartIcon,
  Calendar
} from 'lucide-react';
import api from '../api/axios';
import { useFestival } from '../context/FestivalContext';
import { StatCard } from '../components/ui/StatCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToPDF, exportToExcel, printReport } from '../utils/exportUtils';

export const Reports = () => {
  const { selectedFestivalId, selectedFestival } = useFestival();
  const [activeTab, setActiveTab] = useState('final');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!selectedFestivalId) return;
    try {
      setLoading(true);
      setError(null);
      let endpoint = `/reports/final?festivalId=${selectedFestivalId}`;
      if (activeTab === 'day-wise') endpoint = `/reports/day-wise-expenses?festivalId=${selectedFestivalId}`;
      else if (activeTab === 'category-wise') endpoint = `/reports/category-wise-expenses?festivalId=${selectedFestivalId}`;
      else if (activeTab === 'donations') endpoint = `/reports/donations?festivalId=${selectedFestivalId}`;
      else if (activeTab === 'lucky-draw') endpoint = `/reports/lucky-draw?festivalId=${selectedFestivalId}`;
      else if (activeTab === 'velampata') endpoint = `/reports/velampata?festivalId=${selectedFestivalId}`;
      else if (activeTab === 'sponsors') endpoint = `/reports/sponsors?festivalId=${selectedFestivalId}`;

      const res = await api.get(endpoint);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError(err.response?.data?.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [selectedFestivalId, activeTab]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportPDF = () => {
    if (!reportData) return;

    if (activeTab === 'final') {
      const summary = reportData.financialSummary || {};
      const headers = ['Metric', 'Amount (₹)'];
      const data = [
        ['Total Donations', formatCurrency(summary.totalDonations)],
        ['Lucky Draw Collection', formatCurrency(summary.totalLuckyDraw)],
        ['Velampata Collection', formatCurrency(summary.totalVelampata)],
        ['TOTAL INCOME', formatCurrency(summary.totalIncome)],
        ['TOTAL EXPENSES', formatCurrency(summary.totalExpenses)],
        ['REMAINING BALANCE', formatCurrency(summary.remainingBalance)],
      ];
      exportToPDF({
        title: 'Final Festival Summary Report',
        subtitle: `${selectedFestival?.festivalName || ''} (${selectedFestival?.year || ''})`,
        headers,
        data,
        fileName: 'final_festival_report.pdf',
      });
    } else if (activeTab === 'day-wise') {
      const headers = ['Festival Day', 'Total Entries', 'Total Amount (₹)'];
      const data = (reportData || []).map((d) => [
        `Day ${d.day}`,
        d.totalEntries,
        formatCurrency(d.totalAmount),
      ]);
      exportToPDF({
        title: 'Day-Wise Expenses Summary Report',
        headers,
        data,
        fileName: 'day_wise_expenses_report.pdf',
      });
    } else if (activeTab === 'category-wise') {
      const headers = ['Category Name', 'Total Entries', 'Total Amount (₹)'];
      const data = (reportData || []).map((c) => [
        c.categoryName,
        c.totalEntries,
        formatCurrency(c.totalAmount),
      ]);
      exportToPDF({
        title: 'Category-Wise Expenses Summary Report',
        headers,
        data,
        fileName: 'category_wise_expenses_report.pdf',
      });
    } else if (activeTab === 'donations') {
      const list = reportData.data || [];
      const headers = ['#', 'Donor Name', 'Village / Area', 'Amount (₹)', 'Payment Mode', 'Receiver', 'Date'];
      const data = list.map((d, i) => [
        i + 1,
        d.donorName,
        d.villageArea || '-',
        formatCurrency(d.amount),
        d.paymentMode,
        d.receiverName,
        formatDate(d.donationDate),
      ]);
      exportToPDF({
        title: 'Donations Collection Report',
        subtitle: `Total: ${formatCurrency(reportData.totalAmount)} (${reportData.totalEntries} entries)`,
        headers,
        data,
        fileName: 'donations_report.pdf',
      });
    } else if (activeTab === 'lucky-draw') {
      const list = reportData.data || [];
      const headers = ['#', 'Ticket No', 'Person Name', 'Mobile No', 'Amount (₹)', 'Payment Mode', 'Receiver', 'Date'];
      const data = list.map((e, i) => [
        i + 1,
        e.ticketNumber,
        e.personName,
        e.mobileNumber || '-',
        formatCurrency(e.amount),
        e.paymentMode,
        e.receiverName,
        formatDate(e.entryDate),
      ]);
      exportToPDF({
        title: 'Lucky Draw Report',
        subtitle: `Total: ${formatCurrency(reportData.totalAmount)} (${reportData.totalEntries} entries)`,
        headers,
        data,
        fileName: 'lucky_draw_report.pdf',
      });
    } else if (activeTab === 'velampata') {
      const list = reportData.data || [];
      const headers = ['#', 'Item Name', 'Person Name', 'Amount (₹)', 'Payment Mode', 'Receiver', 'Date'];
      const data = list.map((e, i) => [
        i + 1,
        e.itemName,
        e.personName,
        formatCurrency(e.amount),
        e.paymentMode,
        e.receiverName,
        formatDate(e.entryDate),
      ]);
      exportToPDF({
        title: 'Velampata Report',
        subtitle: `Total: ${formatCurrency(reportData.totalAmount)} (${reportData.totalEntries} entries)`,
        headers,
        data,
        fileName: 'velampata_report.pdf',
      });
    } else if (activeTab === 'sponsors') {
      const list = reportData.data || [];
      const headers = ['#', 'Sponsor Name', 'Village / Area', 'Contribution Details'];
      const data = list.map((s, i) => [
        i + 1,
        s.sponsorName,
        s.villageArea || '-',
        s.contribution,
      ]);
      exportToPDF({
        title: 'Sponsors Contribution Report',
        headers,
        data,
        fileName: 'sponsors_report.pdf',
      });
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;

    if (activeTab === 'final') {
      const summary = reportData.financialSummary || {};
      const headers = ['Metric', 'Amount'];
      const data = [
        ['Total Donations', summary.totalDonations],
        ['Lucky Draw Collection', summary.totalLuckyDraw],
        ['Velampata Collection', summary.totalVelampata],
        ['TOTAL INCOME', summary.totalIncome],
        ['TOTAL EXPENSES', summary.totalExpenses],
        ['REMAINING BALANCE', summary.remainingBalance],
      ];
      exportToExcel({ title: 'Final Summary', headers, data, fileName: 'final_report.xlsx' });
    } else if (activeTab === 'day-wise') {
      const headers = ['Day', 'Total Entries', 'Total Amount'];
      const data = (reportData || []).map((d) => [d.day, d.totalEntries, d.totalAmount]);
      exportToExcel({ title: 'Day-wise Expenses', headers, data, fileName: 'day_wise_expenses.xlsx' });
    } else if (activeTab === 'category-wise') {
      const headers = ['Category', 'Total Entries', 'Total Amount'];
      const data = (reportData || []).map((c) => [c.categoryName, c.totalEntries, c.totalAmount]);
      exportToExcel({ title: 'Category-wise Expenses', headers, data, fileName: 'category_wise_expenses.xlsx' });
    } else {
      const list = reportData.data || [];
      const headers = Object.keys(list[0] || {});
      const data = list.map((item) => Object.values(item));
      exportToExcel({ title: activeTab, headers, data, fileName: `${activeTab}_report.xlsx` });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <div className="breadcrumb">
            Generate and export comprehensive festival financial reports
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={fetchReport}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-pdf" onClick={handleExportPDF}>
            <FileText size={14} /> Export PDF
          </button>
          <button className="btn btn-excel" onClick={handleExportExcel}>
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button className="btn btn-outline" onClick={printReport}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
        }}
      >
        {[
          { id: 'final', label: 'Final Festival Summary' },
          { id: 'day-wise', label: 'Day-wise Expenses' },
          { id: 'category-wise', label: 'Category-wise Expenses' },
          { id: 'donations', label: 'Donations Report' },
          { id: 'lucky-draw', label: 'Lucky Draw Report' },
          { id: 'velampata', label: 'Velampata Report' },
          { id: 'sponsors', label: 'Sponsors Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '12.5px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div>Generating report...</div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p style={{ color: '#dc2626' }}>{error}</p>
        </div>
      ) : (
        <div>
          {/* FINAL FESTIVAL REPORT VIEW */}
          {activeTab === 'final' && reportData && (
            <div>
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <StatCard
                  title="Total Income"
                  amount={reportData.financialSummary?.totalIncome || 0}
                  icon={DollarSign}
                  accentColor="#10b981"
                />
                <StatCard
                  title="Total Expenses"
                  amount={reportData.financialSummary?.totalExpenses || 0}
                  icon={Calendar}
                  accentColor="#ef4444"
                />
                <StatCard
                  title="Remaining Balance"
                  amount={reportData.financialSummary?.remainingBalance || 0}
                  icon={PieChartIcon}
                  accentColor="#6d28d9"
                />
              </div>

              <div className="charts-grid">
                {/* Income Summary Table */}
                <div className="chart-card">
                  <div className="chart-header">
                    <span>Income Breakdown</span>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Income Source</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Donations Collection</td>
                        <td>
                          <strong>
                            {formatCurrency(reportData.financialSummary?.totalDonations)}
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Lucky Draw Collection</td>
                        <td>
                          <strong>
                            {formatCurrency(reportData.financialSummary?.totalLuckyDraw)}
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Velampata Collection</td>
                        <td>
                          <strong>
                            {formatCurrency(reportData.financialSummary?.totalVelampata)}
                          </strong>
                        </td>
                      </tr>
                      <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                        <td>TOTAL INCOME</td>
                        <td style={{ color: '#16a34a' }}>
                          {formatCurrency(reportData.financialSummary?.totalIncome)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Day Wise Expenses Table */}
                <div className="chart-card">
                  <div className="chart-header">
                    <span>Day-wise Expenses Summary</span>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Festival Day</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.dayWiseExpenses || []).map((d) => (
                        <tr key={d.day}>
                          <td>Day {d.day}</td>
                          <td>{formatCurrency(d.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DAY WISE EXPENSES VIEW */}
          {activeTab === 'day-wise' && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Festival Day</th>
                    <th>Total Entries</th>
                    <th>Total Expenses Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData || []).map((d) => (
                    <tr key={d.day}>
                      <td>
                        <strong>Day {d.day}</strong>
                      </td>
                      <td>{d.totalEntries} entries</td>
                      <td style={{ color: '#dc2626', fontWeight: 700 }}>
                        {formatCurrency(d.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CATEGORY WISE EXPENSES VIEW */}
          {activeTab === 'category-wise' && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Total Entries</th>
                    <th>Total Expenses Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData || []).map((c) => (
                    <tr key={c.categoryId}>
                      <td>
                        <strong>{c.categoryName}</strong>
                      </td>
                      <td>{c.totalEntries} entries</td>
                      <td style={{ color: '#dc2626', fontWeight: 700 }}>
                        {formatCurrency(c.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DONATIONS / LUCKY DRAW / VELAMPATA / SPONSORS VIEWS */}
          {['donations', 'lucky-draw', 'velampata', 'sponsors'].includes(activeTab) && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {Object.keys((reportData.data || [])[0] || {}).map((key) => (
                      <th key={key}>{key.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(reportData.data || []).map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      {Object.entries(row).map(([k, val]) => (
                        <td key={k}>
                          {k.toLowerCase().includes('amount')
                            ? formatCurrency(val)
                            : k.toLowerCase().includes('date')
                            ? formatDate(val)
                            : val ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
