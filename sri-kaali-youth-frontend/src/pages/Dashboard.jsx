import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  RefreshCw
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../api/axios';
import { useFestival } from '../context/FestivalContext';
import { StatCard } from '../components/ui/StatCard';
import { formatCurrency } from '../utils/formatters';

const PIE_COLORS = ['#6d28d9', '#f59e0b', '#06b6d4', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6'];

export const Dashboard = () => {
  const { selectedFestivalId, selectedFestival } = useFestival();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!selectedFestivalId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/dashboard?festivalId=${selectedFestivalId}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [selectedFestivalId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        <div>Loading festival financial summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
        <button className="btn btn-outline" onClick={fetchDashboard} style={{ marginTop: '16px' }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const {
    financialSummary = {},
    incomeBreakdown = {},
    incomePaymentMode = {},
    expensePaymentMode = {},
    expensesByCategory = [],
    dayWiseExpenses = [],
  } = data || {};

  // Recharts Income Breakdown format
  const incomePieData = [
    { name: 'Donations', value: incomeBreakdown.donations || 0 },
    { name: 'Lucky Draw', value: incomeBreakdown.luckyDraw || 0 },
    { name: 'Velampata', value: incomeBreakdown.velampata || 0 },
  ].filter((d) => d.value > 0);

  // Recharts Expenses By Category format
  const categoryPieData = expensesByCategory.map((c) => ({
    name: c.categoryName,
    value: c.amount,
  }));

  // Recharts Payment Mode format
  const paymentModeData = [
    {
      mode: 'Cash',
      Income: incomePaymentMode.cash || 0,
      Expenses: expensePaymentMode.cash || 0,
    },
    {
      mode: 'Online',
      Income: incomePaymentMode.online || 0,
      Expenses: expensePaymentMode.online || 0,
    },
  ];

  // Recharts Day Wise Trend format
  const dayWiseData = dayWiseExpenses.map((d) => ({
    day: `Day ${d.day}`,
    Amount: d.amount,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Dashboard</h1>
          <div className="breadcrumb">
            Festival: <strong>{selectedFestival?.festivalName || 'Active Festival'}</strong> (
            {selectedFestival?.year || ''})
          </div>
        </div>
        <button className="btn btn-outline" onClick={fetchDashboard}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Stat Cards Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Income"
          amount={financialSummary.totalIncome || 0}
          icon={TrendingUp}
          accentColor="#10b981"
        />
        <StatCard
          title="Total Expenses"
          amount={financialSummary.totalExpenses || 0}
          icon={TrendingDown}
          accentColor="#ef4444"
        />
        <StatCard
          title="Remaining Balance"
          amount={financialSummary.remainingBalance || 0}
          icon={Wallet}
          accentColor="#6d28d9"
        />
        <StatCard
          title="Today's Income"
          amount={financialSummary.todayIncome || 0}
          icon={DollarSign}
          accentColor="#3b82f6"
        />
        <StatCard
          title="Today's Expenses"
          amount={financialSummary.todayExpenses || 0}
          icon={Calendar}
          accentColor="#f59e0b"
        />
        <StatCard
          title="Today's Balance"
          amount={financialSummary.todayBalance || 0}
          icon={Wallet}
          accentColor="#8b5cf6"
        />
      </div>

      {/* Visual Charts Section */}
      <div className="charts-grid">
        {/* Income Breakdown Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span>Income Breakdown</span>
            <PieChartIcon size={18} className="text-slate-400" />
          </div>
          {incomePieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              No income recorded yet.
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={incomePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  >
                    {incomePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span>Expenses By Category</span>
            <PieChartIcon size={18} className="text-slate-400" />
          </div>
          {categoryPieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              No expenses by category.
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Mode Cash vs Online */}
        <div className="chart-card">
          <div className="chart-header">
            <span>Payment Mode Distribution</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={paymentModeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mode" />
                <YAxis tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day Wise Expenses Trend */}
        <div className="chart-card">
          <div className="chart-header">
            <span>Day-wise Expenses Breakdown</span>
          </div>
          {dayWiseData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              No day-wise expenses recorded yet.
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={dayWiseData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="Amount" fill="#6d28d9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
