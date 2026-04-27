import './style.scss'

const Title = ({ report, mode }) => {
  return (
    <div
      className="TWVR gap20"
      style={{
        display: 'flex',
        justifyItems: 'flex-start',
        alignItems: 'center',
        alignContent: 'center',
      }}
    >
      <span className="TWVR-text fs26 fw700">
        {(mode == 'edit' ? 'Edit' : mode === 'view' ? 'View' : 'Add') +
          ` ${report}`}
      </span>
    </div>
  )
}

export default Title
