import { formatCurrency } from '../../utils/formatters';

export const StatCard = ({ title, amount, icon: Icon, accentColor, isCurrency = true }) => {
  return (
    <div className="stat-card" style={{ '--card-accent': accentColor }}>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">
          {isCurrency ? formatCurrency(amount) : amount}
        </div>
      </div>
      {Icon && (
        <div className="stat-icon-wrapper" style={{ color: accentColor, background: `${accentColor}15` }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};
