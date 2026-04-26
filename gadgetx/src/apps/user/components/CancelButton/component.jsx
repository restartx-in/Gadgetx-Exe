import './style.scss'

const CancelButton = ({ disabled, onClick }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="cancel_btn fs16 fw500"
    >
      Cancel
    </button>
  )
}
export default CancelButton
