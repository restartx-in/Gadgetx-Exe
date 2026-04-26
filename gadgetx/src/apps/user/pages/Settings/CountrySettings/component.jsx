import { useState, useEffect } from 'react'
import { useUserContext } from '@/apps/user/context/user.context'
import useUpdateSettings from '@/hooks/api/settings/useUpdateSettings'
import { useToast } from '@/context/ToastContext' 
import { CRUDTYPE } from '@/constants/object/crud'

import SettingsBackButton from '@/components/SettingsBackButton'
import countries from '@/constants/countries'
import { FaSearch } from 'react-icons/fa'
import './style.scss'

const CountrySettings = ({ onBackClick }) => {
  const { settings } = useUserContext()
  const showToast = useToast() 
  const { mutateAsync: updateSettings, isUpdating: isSaving } = useUpdateSettings()

  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('India')

  useEffect(() => {
    if (settings && settings.country) {
      setSelectedCountry(settings.country)
    }
  }, [settings])

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!selectedCountry) {
      return showToast({
        title: 'Please select a country before saving.',
        status: 'warning',
      })
    }

    try {
      await updateSettings({ country: selectedCountry })
      showToast({
        crudItem: 'Country',
        crudType: CRUDTYPE.UPDATE_SUCCESS,
      })
      onBackClick() 
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update country.'
      showToast({ title: msg, status: 'error' })
    }
  }

  return (
    <div className="country-settings">
      <header className="settings_page__header country-settings__header">
  <div className="country-settings__header-left">
    <SettingsBackButton title="Select Country" onBackClick={onBackClick} />
  </div>
  <div className="country-settings__header-right">
    <button
      className="btn btn-primary country-settings__save-btn"
      onClick={handleSave}
      disabled={isSaving || !selectedCountry}
    >
      {isSaving ? 'Saving...' : 'Save'}
    </button>
  </div>
</header>
      <div className="country-settings__search">
        <FaSearch className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="country-settings__list">
        {filteredCountries.length > 0 ? (
          filteredCountries.map((country) => (
            <div
              key={country.name}
              className={`country-settings__option ${
                selectedCountry === country.name ? 'selected' : ''
              }`}
              onClick={() => setSelectedCountry(country.name)}
            >
              <div className="country-settings__option-left">
                <span className="country-settings__flag">{country.flag}</span>
                <span className="fs16 fw500">{country.name}</span>
              </div>
              <div className="country-settings__option-right">
                <span className="country-settings__currency-symbol">
                  {country.currencySymbol}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No countries found</p>
        )}
      </div>
    </div>
  )
}

export default CountrySettings