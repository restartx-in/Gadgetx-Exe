import React, { useState, useEffect } from "react";
import { FaExpand, FaCompress } from "react-icons/fa";
import { useHotkeys } from "react-hotkeys-hook";
import "./style.scss";

const FullScreenButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useHotkeys(
    "ctrl+shift+f,f11",
    (event) => {
      event.preventDefault();
      toggleFullscreen();
    },
    { enableOnFormTags: true },
    [isFullscreen],
  );

  return (
    <button
      className="fullscreen_button"
      onClick={toggleFullscreen}
      title={isFullscreen ? "Exit Fullscreen (Ctrl+Shift+F)" : "Fullscreen (Ctrl+Shift+F)"}
      type="button"
    >
      {isFullscreen ? <FaCompress /> : <FaExpand />}
    </button>
  );
};

export default FullScreenButton;