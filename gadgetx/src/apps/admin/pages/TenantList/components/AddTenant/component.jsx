import { useState, useEffect, useRef } from 'react'
import InputField from '@/components/InputField'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import { Transaction } from '@/constants/object/transaction'
import Title from '@/components/Title'
import { Report } from '@/constants/object/report'
import CancelButton from '@/components/CancelButton'
import SubmitButton from '@/components/SubmitButton'
import DeleteTextButton from '@/components/DeleteTextButton'

// Updated Hooks
import useCreateTenant from '@/apps/user/hooks/api/tenant/useCreateTenant'
import useUpdateTenant from '@/apps/user/hooks/api/tenant/useUpdateTenant'
import useDeleteTenant from '@/apps/user/hooks/api/tenant/useDeleteTenant'

import './style.scss'

const AddTenant = ({
  isOpen,
  onClose,
  mode,
  selectedTenant,
  onTenantCreated,
}) => {
  const showToast = useToast()
  const nameInputRef = useRef(null)

  // Updated default form with new fields
  const defaultForm = {
    name: '',
    type: '',
    plan: '',
    username: '',
    password: '',
    confirmPassword: '',
  }

  const [form, setForm] = useState({ ...defaultForm })
  const disabled = mode === 'view'
  const { mutateAsync: createTenant, isLoading: creating } = useCreateTenant()
  const { mutateAsync: updateTenant, isLoading: updating } = useUpdateTenant()
  const { mutateAsync: deleteTenant, isLoading: deleting } = useDeleteTenant()

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' || mode === 'view') {
        // On edit/view, load tenant data.
        // Note: Passwords usually aren't loaded for security, so we keep them blank in state
        setForm({
          ...defaultForm,
          ...selectedTenant,
        })
      } else if (mode === 'add') {
        const savedForm = localStorage.getItem('tenant_form')
        setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm })
      }
      if (mode === 'add' || mode === 'edit') {
        setTimeout(() => nameInputRef.current?.focus(), 100)
      }
    }
  }, [isOpen, mode, selectedTenant])

  // Save form to local storage (excluding passwords for security)
  useEffect(() => {
    if (mode === 'add') {
      const { ...safeForm } = form
      localStorage.setItem('tenant_form', JSON.stringify(safeForm))
    }
  }, [form, mode])

  const clearLocalStorage = () => {
    localStorage.removeItem('tenant_form')
    setForm({ ...defaultForm })
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic Name Validation
    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please Enter Tenant name.',
        status: TOASTSTATUS.ERROR,
      })
      nameInputRef.current?.focus()
      return
    }

    // Password Match Validation
    if (form.password !== form.confirmPassword) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Passwords do not match.',
        status: TOASTSTATUS.ERROR,
      })
      return
    }

    // Require password on Add mode
    if (mode === 'add' && !form.password) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please enter a password.',
        status: TOASTSTATUS.ERROR,
      })
      return
    }

    try {
      // Remove confirmPassword from payload before sending to API
      const { confirmPassword, ...payload } = form

      if (mode === 'edit') {
        // If password is empty in edit mode, remove it from payload (don't overwrite with empty string)
        if (!payload.password) {
          delete payload.password
        }

        await updateTenant(
          { id: selectedTenant.id, data: payload },
          {
            onSuccess: () => {
              onClose()
            },
          }
        )
        showToast({
          crudItem: CRUDITEM.Tenant,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        })
      } else {
        const newTenant = await createTenant(payload)

        showToast({
          crudItem: CRUDITEM.Tenant,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        })

        clearLocalStorage()
        onClose()

        if (onTenantCreated) {
          onTenantCreated(newTenant)
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'An unexpected error occurred.'
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTenant(selectedTenant.id, {
        onSuccess: () => {
          onClose()
          clearLocalStorage()
        },
      })
      showToast({
        crudItem: CRUDITEM.Tenant,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      })
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || 'Failed to delete tenant.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="add-tenant-modal"
      size="sm" // You might want to increase this to 'md' given the extra fields
    >
      <ModalHeader>
        <Title report={Report.Tenant || 'Tenant'} mode={mode} />
      </ModalHeader>
      <ModalBody className="add-tenant-modal__body">
        <InputField
          ref={nameInputRef}
          disabled={disabled}
          name="name"
          type="text"
          placeholder="Tenant Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        {/* Type Selection Field */}
        <div className="input-field-wrapper" style={{ marginBottom: '1rem' }}>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            disabled={disabled}
            className="input-field" // Assuming this class matches InputField styling
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
            }}>
            <option value="" disabled>
              Select Type
            </option>
            <option value="gadget">Gadget</option>
            <option value="vehicle">Vehicle</option>
            <option value="fitness">Fitness</option>
            <option value="garage">Garage</option>
            <option value="restaurant">Resturant</option>
            <option value="optical">Optical</option>
          </select>
        </div>

        <InputField
          disabled={disabled}
          name="plan"
          type="text"
          placeholder="Plan"
          value={form.plan}
          onChange={handleChange}
        />

        <InputField
          disabled={disabled}
          name="username"
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />

        <InputField
          disabled={disabled}
          name="password"
          type="password"
          placeholder={
            mode === 'edit' ? 'New Password (leave blank to keep)' : 'Password'
          }
          value={form.password}
          onChange={handleChange}
          required={mode === 'add'}
        />

        <InputField
          disabled={disabled}
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required={mode === 'add' || form.password.length > 0}
        />
      </ModalBody>
      <ModalFooter
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}
        className="add-tenant-modal__footer">
        {mode === 'add' && <CancelButton onClick={onClose} />}
        {mode === 'edit' && (
          <DeleteTextButton
            transaction={Transaction.Tenant}
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        <SubmitButton
          isLoading={creating || updating}
          disabled={disabled}
          type={mode}
          onClick={handleSubmit}
        />
      </ModalFooter>
    </Modal>
  )
}

export default AddTenant
