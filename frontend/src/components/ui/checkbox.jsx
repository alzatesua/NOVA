export function Checkbox({ id, checked, onCheckedChange, className = "" }) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
      className={`form-checkbox h-5 w-5 text-blue-600 ${className}`}
    />
  );
}
