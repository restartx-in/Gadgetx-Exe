import './style.scss';

const TdSL = ({ page = 0, pageSize = 0, index }) => {
  return (
    <td className="td_sl fs16">
      <div className="td_sl-content">
        {(page - 1 ?? 1) * pageSize + index + 1}
      </div>
    </td>
  );
};

export default TdSL;
