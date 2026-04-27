import "./style.scss";

const TdDate = ({ children }) => {
  function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Example:

  return (
    <td className="td_date fs16">
      <div className="td_date__content fs18">
        {children ? formatDate(children) : ""}
      </div>
    </td>
  );
};

export default TdDate;
