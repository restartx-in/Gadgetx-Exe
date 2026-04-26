import { useRef, useEffect, useState } from 'react'
import { useUserContext } from '@/apps/user/context/user.context'
import useUpdateSettings from '@/hooks/api/settings/useUpdateSettings'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE } from '@/constants/object/crud'

import SettingsBackButton from '@/components/SettingsBackButton'
import InputFieldwithlabel from '@/components/InputFieldwithlabel'

import './style.scss'

const OtherSettings = ({ onBackClick }) => {
  const showToast = useToast()
  const { mutateAsync: updateUser } = useUpdateSettings()

  const {
    isUpdating,
    sidebarLabels: contextSidebarLabels,
    refetchSettings,
  } = useUserContext()

  const [formLabels, setFormLabels] = useState({})
  const [initialLabels, setInitialLabels] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const firstLabelInputRef = useRef(null)

  useEffect(() => {
    firstLabelInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (contextSidebarLabels) {
      setFormLabels(contextSidebarLabels)
      setInitialLabels(contextSidebarLabels)
    }
  }, [contextSidebarLabels])

  useEffect(() => {
    if (JSON.stringify(formLabels) !== JSON.stringify(initialLabels)) {
      setHasUnsavedChanges(true)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [formLabels, initialLabels])

  const validateSidebarLabels = (labels) =>
    Object.values(labels).every((label) => label?.trim().length > 0)

  const handleLabelsSave = async (e) => {
    e.preventDefault()
    if (!validateSidebarLabels(formLabels)) {
      return showToast({
        title: 'All sidebar labels must be filled.',
        status: 'error',
      })
    }
    try {
      await updateUser({ sidebar_labels: formLabels })

      if (refetchSettings) {
        await refetchSettings()
      }

      setInitialLabels(formLabels)

      showToast({
        crudItem: 'Sidebar Labels',
        crudType: CRUDTYPE.UPDATE_SUCCESS,
      })
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to update sidebar labels.'
      showToast({ title: msg, status: 'error' })
    }
  }

  const formatLabel = (key) => {
    const withSpaces = key.replace(/_/g, ' ')
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
  }

  return (
    <div className="sidebar-menu-container">
      <div className="other_settings">
        <header className="other_settings-header">
          <SettingsBackButton title="Other Settings" onBackClick={onBackClick} />
        </header>
        <section
          className="other_settings-section"
          aria-labelledby="sidebar-labels-title"
        >
          <h2
            id="sidebar-labels-title"
            className="other_settings-section-title fw600"
          >
            Sidebar Menu Labels
          </h2>
          <form onSubmit={handleLabelsSave} className="other_settings__form">
            <div className="other_settings__form-grid">
              {Object.keys(formLabels).map((key, idx) => (
                <InputFieldwithlabel
                  key={key}
                  id={`sidebar-label-${key}`}
                  label={formatLabel(key)}
                  value={formLabels[key] || ''}
                  onChange={(e) =>
                    setFormLabels((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  inputClassName="settings_page__input"
                  wrapperClassName="settings_page__input-wrapper"
                  disabled={isUpdating}
                  ref={idx === 0 ? firstLabelInputRef : null}
                  aria-label={`${key} Label Input`}
                />
              ))}
            </div>
            <div className="other_settings__form-footer">
              {hasUnsavedChanges && (
                <button
                  className="other_settings__form-footer-submit_button2"
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <span className="other_settings__form-footer-submit_button2-loader"></span>
                  ) : (
                    <span className="other_settings__form-footer-submit_button2-text fw500">
                      Save Labels
                    </span>
                  )}
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default OtherSettings