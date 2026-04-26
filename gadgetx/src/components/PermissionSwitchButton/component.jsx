import './style.scss';

const PermissionSwitchButton = ({
  name,
  value = false,
  onChange,
  required = false,
  disabled = false,
  variant = 'default', // <-- Added variant prop for color styling
}) => {
  const handleToggle = (e) => {
    const newValue = !value;
    const event = {
      ...e,
      target: {
        ...e.target,
        name,
        value: newValue,
      },
    };
    onChange && onChange(event);
  };

  return (
    // Added the variant class to the label
    <label className={`switchs ${variant} ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        name={name}
        checked={value}
        onChange={handleToggle}
        required={required}
        disabled={disabled}
      />
      <span className="switchs__slider" />
    </label>
  );
};

export default PermissionSwitchButton;