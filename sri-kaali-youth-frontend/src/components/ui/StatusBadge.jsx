export const StatusBadge = ({ isActive }) => {
  return (
    <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};
