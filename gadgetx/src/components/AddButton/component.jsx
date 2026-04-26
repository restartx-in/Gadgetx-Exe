import { IoAdd } from 'react-icons/io5'
import './style.scss'

const AddButton = ({
  // children,
  onClick,
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}) => {
  const buttonClasses = `add_button ${size} fw500 ${className}`.trim()

  const handleButtonClick = (e) => onClick(e)

  // let buttonContent = children

  const buttonContent = (
    <>
      <span className="add_button-icon">
        <IoAdd className="w-5 h-5 add_button-icon-svg" />
      </span>
      <span className="add_button-text">Add New</span>
    </>
  )

  return (
    <>
      <button
        className={buttonClasses}
        onClick={handleButtonClick}
        type='button'
        disabled={disabled}
        {...props}
      >
        {buttonContent}
      </button>
    </>
  )
}

export default AddButton
