import React, { createContext, useContext, useState, Children, cloneElement } from 'react';
import './style.scss'; 

const TabsContext = createContext();

export const Tabs = ({ index = 0, children }) => {
  const [activeIndex, setActiveIndex] = useState(index);

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList = ({ children }) => {
  const { activeIndex, setActiveIndex } = useContext(TabsContext);

  // Map over children to assign indices dynamically
  const tabs = Children.map(children, (child, index) =>
    cloneElement(child, {
      isActive: activeIndex === index,
      onClick: () => setActiveIndex(index),
    })
  );

  return <div className="tabs__list">{tabs}</div>;
};

export const Tab = ({ isActive, onClick, children }) => {
  // Build the BEM class string with the active modifier
  const tabClasses = `tabs__tab fs14 fw500 ${isActive ? 'tabs__tab--active' : ''}`.trim();

  return (
    <button
      className={tabClasses}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const TabPanels = ({ children }) => {
  const { activeIndex } = useContext(TabsContext);
  return <div className="tabs__panels">{children[activeIndex]}</div>;
};

export const TabPanel = ({ children }) => {
  return <div className="tabs__panel">{children}</div>;
};