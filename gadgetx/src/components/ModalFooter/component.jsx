const ModalFooter = ({ children }) => {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      className="gap16 pt40"
    >
      {children}
    </div>
  )
}
export default ModalFooter
