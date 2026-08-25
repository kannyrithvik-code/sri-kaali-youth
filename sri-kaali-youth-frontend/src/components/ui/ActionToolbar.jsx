import { Search, RefreshCw, FileText, FileSpreadsheet, Printer, Plus } from 'lucide-react';

export const ActionToolbar = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  showDateFilter = true,
  onRefresh,
  onExportPDF,
  onExportExcel,
  onPrint,
  onAdd,
  addBtnLabel = 'Add Record',
  refreshing = false,
}) => {
  return (
    <div className="toolbar-card">
      <div className="toolbar-filters">
        {onSearchChange !== undefined && (
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {showDateFilter && (onFromDateChange || onToDateChange) && (
          <div className="date-filter-group">
            {onFromDateChange && (
              <input
                type="date"
                className="filter-input"
                value={fromDate || ''}
                onChange={(e) => onFromDateChange(e.target.value)}
                placeholder="From Date"
              />
            )}
            <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>to</span>
            {onToDateChange && (
              <input
                type="date"
                className="filter-input"
                value={toDate || ''}
                onChange={(e) => onToDateChange(e.target.value)}
                placeholder="To Date"
              />
            )}
          </div>
        )}
      </div>

      <div className="toolbar-actions">
        {onRefresh && (
          <button
            className="btn btn-outline"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
        )}

        {onExportPDF && (
          <button className="btn btn-pdf" onClick={onExportPDF} title="Export PDF">
            <FileText size={14} />
            Export PDF
          </button>
        )}

        {onExportExcel && (
          <button className="btn btn-excel" onClick={onExportExcel} title="Export Excel">
            <FileSpreadsheet size={14} />
            Export Excel
          </button>
        )}

        {onPrint && (
          <button className="btn btn-outline" onClick={onPrint} title="Print Report">
            <Printer size={14} />
            Print
          </button>
        )}

        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={16} />
            {addBtnLabel}
          </button>
        )}
      </div>
    </div>
  );
};
