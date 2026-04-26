import './style.scss';

const Tr = ({ children, ...props }) => {
  return (
    <tr className="table_row" {...props}>
      {children}
    </tr>
  );
};

export default Tr;