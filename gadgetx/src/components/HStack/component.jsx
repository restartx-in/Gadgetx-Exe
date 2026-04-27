const HStack = ({
  children,
  className = '',
  justifyContent = 'flex-end',
  alignItems = 'center',
  gap = '12px',
  onClick,
  style,
}) => {
  const handleClick = (event) => {
    if (onClick) {
      event.preventDefault() 
      onClick(event) 
    }
  }

  const inlineStyles = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent,
    alignItems,
    gap: gap,
  }

  return (
    <div
      className={`hstack ${className}`}
      style={{ ...inlineStyles, ...style }}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

export default HStack
