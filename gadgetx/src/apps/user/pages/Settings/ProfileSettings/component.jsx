import { useRef, useEffect } from 'react'
import { useUserContext } from '@/apps/user/context/user.context'
import useUpdateSettings from '@/hooks/api/settings/useUpdateSettings'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE } from '@/constants/object/crud'

import SettingsBackButton from '@/components/SettingsBackButton'
import InputFieldwithlabel from '@/components/InputFieldwithlabel'
import Button from '@/components/Button'

import './style.scss'

const ProfileSettings = ({ onBackClick }) => {
  const showToast = useToast()
  const { mutateAsync: updateUser } = useUpdateSettings()

  const {
    settings: data,
    isUpdating,
    companyName,
    setCompanyName,
    isNameEditing,
    setIsNameEditing,
  } = useUserContext()

  const nameInputRef = useRef(null)

  useEffect(() => {
    if (isNameEditing) {
      nameInputRef.current?.focus()
    }
  }, [isNameEditing])

  useEffect(() => {
    return () => {
      setIsNameEditing(false)
      setCompanyName(data?.app_name || '')
    }
  }, [data, setIsNameEditing, setCompanyName])


  const validateCompanyName = (name) => name.length >= 2 && name.length <= 50

  const handleNameSave = async (e) => {
    e.preventDefault()
    if (!validateCompanyName(companyName)) {
      return showToast({
        title: 'Company name must be 2-50 characters long.',
        status: 'error',
      })
    }
    try {
      await updateUser({ app_name: companyName })
      setIsNameEditing(false)
      showToast({
        crudItem: 'Company Name',
        crudType: CRUDTYPE.UPDATE_SUCCESS,
      })
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update company name.'
      showToast({ title: msg, status: 'error' })
    }
  }

  return (
    <div className="profile-settings">
      <header className="settings_page__header">
        <SettingsBackButton title="Profile Settings" onBackClick={onBackClick} />
      </header>

      <section
        className="settings_page__section"
        aria-labelledby="company-name-title"
      >
        <h2
          id="company-name-title"
          className="settings_page__section-title fs20 fw600"
        >
          Company Name
        </h2>
        <form onSubmit={handleNameSave} className="settings_page__form">
          <div className="settings_page__row">
            <InputFieldwithlabel
              id="companyName"
              ref={nameInputRef}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              inputClassName="settings_page__input fs16"
              wrapperClassName="settings_page__input-wrapper"
              disabled={!isNameEditing || isUpdating}
              required
              aria-label="Company Name Input"
            />
            {isNameEditing && (
              <button className="submit_button2" type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <span className="submit_button2-loader"></span>
                ) : (
                  <span className="submit_button2-text fs18 fw500 ">Save</span>
                )}
              </button>
            )}
          </div>
        </form>
        {!isNameEditing && (
          <Button
            type="button"
            variant="secondary"
            size="medium"
            onClick={() => setIsNameEditing(true)}
            aria-label="Edit Company Name"
            disabled={isUpdating}
            className='editbutton'
          >
            Edit Name
          </Button>
        )}
      </section>
    </div>
  )
}

export default ProfileSettings