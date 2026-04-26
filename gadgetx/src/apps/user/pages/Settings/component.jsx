import { useState } from 'react'
import { useUserContext } from '@/apps/user/context/user.context'

import PageTitleWithBackButton from '@/components/PageTitleWithBackButton'
import Loader from '@/components/Loader'
import ProfileSettings from './ProfileSettings'
import OtherSettings from './OtherSettings'
import CountrySettings from './CountrySettings'
import PrintSettings from './PrintSettings/component'
import JobSheetPrintSettings from './JobSheetPrintSettings/component'
import './style.scss'

const SettingsOption = ({ title, onClick }) => (
  <button className="settings_page__option" onClick={onClick}>
    <span className="fs18 fw500">{title}</span>
  </button>
)

const Settings = () => {
  const [view, setView] = useState('main')

  const [isPrintSettingsModalOpen, setPrintSettingsModalOpen] = useState(false)

  const [isJobSheetPrintSettingsModalOpen, setJobSheetPrintSettingsModalOpen] =
    useState(false)

  const renderMainView = () => (
    <>
      <header className="settings_page__header">
        <PageTitleWithBackButton title="App Settings" />
      </header>

      <div className="settings_page__options-container">
        <SettingsOption
          title="Profile Settings"
          onClick={() => setView('profile')}
        />
        <SettingsOption
          title="Other Settings"
          onClick={() => setView('other')}
        />
        <SettingsOption
          title="Country Settings"
          onClick={() => setView('country')}
        />

        <SettingsOption
          title="Print Settings"
          onClick={() => setPrintSettingsModalOpen(true)}
        />

        <SettingsOption
          title="JobSheet Print Settings"
          onClick={() => setJobSheetPrintSettingsModalOpen(true)}
        />
      </div>
    </>
  )

  return (
    <div className="settings_page">

      <PrintSettings
        isOpen={isPrintSettingsModalOpen}
        onClose={() => setPrintSettingsModalOpen(false)}
      />

      <JobSheetPrintSettings
        isOpen={isJobSheetPrintSettingsModalOpen}
        onClose={() => setJobSheetPrintSettingsModalOpen(false)}
      />

      {view === 'main' && renderMainView()}

      {view === 'profile' && (
        <ProfileSettings onBackClick={() => setView('main')} />
      )}

      {view === 'other' && (
        <OtherSettings onBackClick={() => setView('main')} />
      )}

      {view === 'country' && (
        <CountrySettings onBackClick={() => setView('main')} />
      )}
    </div>
  )
}

export default Settings
