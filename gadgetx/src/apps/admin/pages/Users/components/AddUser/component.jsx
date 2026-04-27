import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// --- CHANGE 1: Import the new, simpler hook ---
import useCreateUser from '@/apps/user/hooks/api/user/useCreateuser'
import InputField from '@/components/InputField'
import Select from '@/components/Select'
import PageTitle from '@/components/PageTitle'
import IconBackButton from '@/components/IconBackButton'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import './style.scss'

// We only need user type options now for the basic form
const userTypeOptions = [
  { value: 'user', label: 'Standard User' },
  { value: 'admin', label: 'Administrator' },
]

const AddUser = () => {
  const navigate = useNavigate()
  const showToast = useToast()

  // --- CHANGE 2: Use the new hook ---
  const { mutateAsync: createUser, isPending, error } = useCreateUser()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    user_type: 'user', // Default to 'user'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Passwords do not match.',
        status: TOASTSTATUS.ERROR,
      })
      return
    }

    // --- CHANGE 3: Create a simple payload object ---
    // No more FormData needed!
    const payload = {
      username: formData.username,
      password: formData.password,
      user_type: formData.user_type,
    }

    try {
      await createUser(payload)
      showToast({
        crudItem: CRUDITEM.USER,
        crudType: CRUDTYPE.CREATE_SUCCESS,
      })
      navigate('/admin/users') // Or wherever your user list is
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          err.response?.data?.error ||
          err.response?.data?.errors?.[0]?.msg ||
          'Failed to create user.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  // The form is simplified to only show necessary fields
  return (
    <div className="add_user">
      <form className="add_user__form" onSubmit={handleSubmit}>
        <div className="back_button_container">
          <IconBackButton />
          <PageTitle title="Create New User" />
        </div>
        <div className="add_user__form-group">
          <InputField
            placeholder="Username"
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="add_user__form-row">
          <div className="add_user__form-row-group">
            <InputField
              placeholder="Password"
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength="6" // Match backend validator
              required
            />
          </div>
          <div className="add_user__form-row-group">
            <InputField
              placeholder="Confirm Password"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="add_user__form-group">
          <Select
            placeholder="User Role"
            id="user_type"
            name="user_type"
            value={formData.user_type}
            onChange={handleChange}
            options={userTypeOptions}
          />
        </div>
        {error && (
          <p className="add_user__form-error">
            {error.response?.data?.message || error.message}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="add_user__submit_btn"
            disabled={isPending}>
            {isPending ? 'Creating User...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddUser
