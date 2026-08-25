import { getPaymentModeBadgeClass } from '../../utils/formatters';

export const PaymentModeBadge = ({ mode }) => {
  if (!mode) return <span>-</span>;
  const badgeClass = getPaymentModeBadgeClass(mode);
  return <span className={`badge ${badgeClass}`}>{mode}</span>;
};
