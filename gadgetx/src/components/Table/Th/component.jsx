import './style.scss';  

const Th = ({ children }) => {
  return (
    <th className="table-header-cell fs18 fw500"> 
      <div className="table-header-cell__content">  
        {children}
      </div>
    </th>
  );
};

export default Th;