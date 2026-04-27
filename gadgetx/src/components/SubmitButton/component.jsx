import './style.scss'

const SubmitButton = ({
  onClick,
  type,
  disabled,
  isLoading,
  label = null
}) => {
  const buttonText = label || (type === 'add' ? 'Submit' : 'Update')

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="submit_button2"
    >
      {isLoading ? (
        <span className="submit_button2-loader"></span>
      ) : (
        <span className="submit_button2-text fs18 fw500">
          {buttonText}
        </span>
      )}
    </button>
  )
}

export default SubmitButton
