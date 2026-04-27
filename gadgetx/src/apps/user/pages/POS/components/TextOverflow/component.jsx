import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./style.scss";

const TextOverflow = ({
  children,
  as: Component = "div",
  className = "",
}) => {
  const contentRef = useRef(null);

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });

  const isOverflowing = () => {
    const el = contentRef.current;
    if (!el) return false;
    return el.scrollWidth > el.clientWidth;
  };

  const handleMouseEnter = (e) => {
    if (!isOverflowing()) return;

    const text = contentRef.current?.innerText;
    if (!text) return;

    setTooltip({
      visible: true,
      x: e.clientX + 12,
      y: e.clientY + 12,
      text,
    });
  };

  const handleMouseMove = (e) => {
    if (!tooltip.visible) return;
    setTooltip((prev) => ({
      ...prev,
      x: e.clientX + 12,
      y: e.clientY + 12,
    }));
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <>
      <Component
        className={`text-overflow ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={contentRef} className="text-overflow__content fs15 fw500">
          {children}
        </div>
      </Component>

      {tooltip.visible &&
        createPortal(
          <div
            className="text-overflow__tooltip"
            style={{
              top: tooltip.y,
              left: tooltip.x,
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}
    </>
  );
};

export default TextOverflow;
