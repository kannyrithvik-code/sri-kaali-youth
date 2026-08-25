import { Eye, Edit3, Trash2, ArrowUpDown, Inbox } from 'lucide-react';
import { PaymentModeBadge } from './PaymentModeBadge';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  onView,
  onEdit,
  onDelete,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  if (loading) {
    return (
      <div className="table-card">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div>Loading data...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-card">
        <div className="empty-state">
          <Inbox className="empty-state-icon" />
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const renderCellContent = (row, col) => {
    const value = row[col.key];

    if (col.render) {
      return col.render(value, row);
    }

    if (col.type === 'currency') {
      return <strong>{formatCurrency(value)}</strong>;
    }

    if (col.type === 'date') {
      return formatDate(value);
    }

    if (col.type === 'paymentMode') {
      return <PaymentModeBadge mode={value} />;
    }

    if (col.type === 'status') {
      return <StatusBadge isActive={value} />;
    }

    return value ?? '-';
  };

  return (
    <div className="table-card">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                  style={{ cursor: col.sortable ? 'pointer' : 'default', width: col.width }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {col.label}
                    {col.sortable && <ArrowUpDown size={13} className="text-slate-400" />}
                  </div>
                </th>
              ))}
              {(onView || onEdit || onDelete) && <th style={{ width: '120px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id || row.categoryId || row.expenseId || row.donationId || row.luckyDrawId || row.velampataId || row.sponsorId || row.userId || index}>
                <td>{index + 1}</td>
                {columns.map((col) => (
                  <td key={col.key}>{renderCellContent(row, col)}</td>
                ))}
                {(onView || onEdit || onDelete) && (
                  <td>
                    <div className="action-buttons">
                      {onView && (
                        <button
                          className="page-btn btn-action-view"
                          onClick={() => onView(row)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          className="page-btn btn-action-edit"
                          onClick={() => onEdit(row)}
                          title="Edit Record"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="page-btn btn-action-delete"
                          onClick={() => onDelete(row)}
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
