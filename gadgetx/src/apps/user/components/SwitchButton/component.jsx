import './style.scss'  

const SwitchButton = ({
  name,
  value = false,
  onChange,
  required = false,
  disabled = false,
}) => {
  const handleToggle = (e) => {
    const newValue = !value
    const event = {
      ...e,
      target: {
        ...e.target,
        name,
        value: newValue,
      },
    }
    onChange && onChange(event)
  }

  return (
    <label className={`switch ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        name={name}
        checked={value}
        onChange={handleToggle}
        required={required}
        disabled={disabled}
      />
      <span className="switch__slider" />
    </label>
  )
}

export default SwitchButton