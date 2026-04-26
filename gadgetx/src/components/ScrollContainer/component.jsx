const ScrollContainer = ({ children }) => (
  <div
    style={{
      flex: 1,
      overflow: 'auto',
      width: '100%',
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%', // ensures flex container stretches
      }}
    >
      {children}
    </div>
  </div>
)

export default ScrollContainer
