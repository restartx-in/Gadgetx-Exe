import React from 'react';
import './style.scss'; // Make sure to import the SCSS file


const StatusButton = ({
  variant,
  outline = false,
  size = 'medium',
  isSelected = false, // Add isSelected prop to control the state
  children,
  className = '',
  ...props
}) => {
  // The base BEM block class.
  const baseClass = 'fw500 status_button';

  // Build an array of BEM modifier classes based on the component's props.
  const modifierClasses = [
    `${baseClass}--${variant}`,
    `${baseClass}--${size}`,
    outline ? `${baseClass}--outline` : '',
    isSelected ? `${baseClass}--selected` : '', // Adds the class for the blue style
  ];

  // Combine the base class, modifiers, and any custom classes from props.
  const buttonClasses = [
    baseClass,
    ...modifierClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export default StatusButton;