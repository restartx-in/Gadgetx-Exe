import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'



const FormDateField = ({ value, onChange, label, disabled = false, name }) => {
  const wrapperClasses = ['form_date_field_wrapper'].filter(Boolean).join(' ')

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className={wrapperClasses}>
        <DatePicker
          label={label}
          value={value}
          onChange={(e) => {
            const formatedDate = e.toISOString().split('T')[0]
            const customEvent = { target: { name, value: formatedDate } }
            onChange(customEvent)
          }}
          disabled={disabled}
          slotProps={{
            textField: {
              size: 'small',
            },
          }}
        />
      </div>
    </LocalizationProvider>
  )
}

export default FormDateField
