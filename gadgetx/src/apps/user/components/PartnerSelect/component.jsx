import AutocompleteInput from '@/components/AutocompleteInput'
import usePartnersPaginated from '@/hooks/api/partner/usePartnersPaginated'
import { useEffect, useState } from 'react'
const PartnerSelect = ({ value, onChange, disabled, required, name }) => {
  const { data, isLoading, error, refetch } = usePartnersPaginated()
  const [vehicleOptions, setVehicleOptions] = useState([])
  useEffect(() => {
    if (data.data) {
      const optoins = data.data.map((partner) => ({
        value: partner.id,
        label: partner.name,
      }))
      setVehicleOptions(optoins)
    }
  }, [data])
  return (
    <AutocompleteInput
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      name={name}
      options={vehicleOptions}
    />
  )
}
export default PartnerSelect
