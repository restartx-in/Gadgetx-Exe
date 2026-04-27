import React from "react";
import { MdCheckCircleOutline } from "react-icons/md";
import { FiXCircle, FiAlertTriangle } from "react-icons/fi";
import { FaRegClock } from "react-icons/fa";
import "./style.scss";

const AttendanceStatusBadge = ({ status }) => {
  const statusKey = status ? status.toLowerCase() : "";

  const statusConfig = {
    present: {
      text: "Present",
      icon: <MdCheckCircleOutline size={14} />,
      className: "present",
    },
    absent: {
      text: "Absent",
      icon: <FiXCircle size={14} />,
      className: "absent",
    },
    late: {
      text: "Late",
      icon: <FaRegClock size={14} />,
      className: "late"
    },
    half_day: {
      text: "Half Day",
      icon: <FiAlertTriangle size={14} />,
      className: "half-day",
    },
  };

  const config = statusConfig[statusKey] || {
    text: status || "-",
    icon: null,
    className: "default",
  };

  return (
    <span className={`attendance-status-badge attendance-status-badge--${config.className}`}>
      {config.icon}
      {config.text}
    </span>
  );
};

export default AttendanceStatusBadge;