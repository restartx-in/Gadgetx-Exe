import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./style.scss";

const TdOverflow = ({ children }) => {
  const tdRef = useRef(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });

  const handleMouseEnter = (e) => {
    const text = tdRef.current?.innerText;
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
      <td
        ref={tdRef}
        className="custom-td"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="td-content">{children}</div>
      </td>

      {tooltip.visible &&
        createPortal(
          <div
            className="td-tooltip"
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

export default TdOverflow;
