import { useNavigate } from 'react-router-dom'
import { Report } from '@/constants/object/report'
import './style.scss'
const ViewReportButton = ({ report }) => {
  const navigate = useNavigate()
  function getReportPath() {
    if (
      [
        Report.Sale,
        Report.Purchase,
        Report.Expense,
        Report.Vehicle,
        Report.CashBook,
      ].includes(report)
    )
      return `/${report.toLowerCase()}-report`
    else return `/${report.toLowerCase()}-list`
  }

  return (
    <button
      className="view_report_button2 fs18 fw500"
      onClick={() => {
        const path = getReportPath()
        navigate(path)
      }}
    >
      View Report
    </button>
  )
}
export default ViewReportButton
