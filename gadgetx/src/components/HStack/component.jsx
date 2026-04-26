const HStack = ({
  children,
  className = '',
  justifyContent = 'flex-end',
  alignItems = 'center',
  gap = '12px',
  style = {},
  onClick,
}) => {

  const handleClick = (event) => {
    if (onClick) {
      event.preventDefault();
      onClick(event);
    }
  };

  const inlineStyles = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent,
    alignItems,
    gap,
    ...style,          
  };

  return (
    <div
      className={`hstack ${className}`}
      style={inlineStyles}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export default HStack;
