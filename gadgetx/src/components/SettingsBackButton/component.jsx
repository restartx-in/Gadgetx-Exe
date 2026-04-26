import SettingsIconBackButton from '@/apps/user/components/SettingsIconBackButton'
import PageTitle from '@/components/PageTitle'
import './style.scss'

const SettingsBackButton = ({ title, onBackClick }) => {
  return (
    <div className="settings_backbutton fs16 fw600">
      {onBackClick && <SettingsIconBackButton onClick={onBackClick} />}

      <PageTitle title={title} />
    </div>
  )
}

export default SettingsBackButton
