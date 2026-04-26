import React, { useRef, useEffect } from "react";
import "./style.scss"; // Import the styles created above

const CustomScrollbar = ({ 
  children, 
  activeIndex = -1, 
  className = "", 
  style = {},
  as: Component = "ul", // Default to 'ul', can be changed to 'div'
  ...rest 
}) => {
  const listRef = useRef(null);

  // Logic: Scroll highlighted item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex];
      if (activeItem) {
        activeItem.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [activeIndex]);

  return (
    <Component
      ref={listRef}
      className={`custom-scrollbar-container ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default CustomScrollbar;