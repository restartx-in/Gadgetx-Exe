import { useState, useEffect, useRef } from 'react'
import useCreateCustomer from '@/hooks/api/customer/useCreateCustomer'
import useUpdateCustomer from '@/hooks/api/customer/useUpdateCustomer'
import useDeleteCustomer from '@/hooks/api/customer/useDeleteCustomer'
import { Transaction } from '@/constants/object/transaction'
import DoneByAutoCompleteWithAddOption from '@/apps/user/components/DoneByAutoCompleteWithAddOption'
import CostCenterAutoCompleteWithAddOption from '@/apps/user/components/CostCenterAutoCompleteWithAddOption'

import InputField from '@/components/InputField'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import { useToast } from '@/context/ToastContext'
import { CRUDITEM, CRUDTYPE } from '@/constants/object/crud'
import { TOASTSTATUS, TOASTTYPE } from '@/constants/object/toastType'
import TextArea from '@/components/TextArea'
import PhoneNoField from '@/components/PhoneNoField'
import Title from '@/apps/user/components/Title'
import { Report } from '@/constants/object/report'
import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import DeleteTextButton from '@/apps/user/components/DeleteTextButton'
import InputFieldWithCalculator from '@/apps/user/components/InputFieldWithCalculator'


const defaultForm = {
  name: '',
  email: '',
  address: '',
  phone: '',
  credit_limit: '',
  outstanding_balance: '',
  done_by_id: '',
  cost_center_id: '',
}

const AddCustomer = ({
  isOpen,
  onClose,
  mode,
  selectedCustomer,
  onCustomerCreated,
}) => {
  const showToast = useToast()
  const nameRef = useRef(null)
  const emailRef = useRef(null)
  const phoneRef = useRef(null)
  const creditLimitRef = useRef(null)
  const outstandingBalanceRef = useRef(null)

  const [form, setForm] = useState({ ...defaultForm })
  const disabled = mode === 'view'

  const { mutateAsync: createCustomer, isLoading: creating } =
    useCreateCustomer()
  const { mutateAsync: updateCustomer, isLoading: updating } =
    useUpdateCustomer()
  const { mutateAsync: deleteCustomer, isLoading: deleting } =
    useDeleteCustomer()

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' || mode === 'view') {
        setForm({ ...defaultForm, ...selectedCustomer })
      } else {
        const savedForm = localStorage.getItem('customer_form')
        const initialData = savedForm ? JSON.parse(savedForm) : defaultForm
        setForm({ ...initialData, ...selectedCustomer })
      }
    }
    if (mode !== 'view') {
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [isOpen, mode, selectedCustomer])

  useEffect(() => {
    if (mode === 'add') {
      localStorage.setItem('customer_form', JSON.stringify(form))
    }
  }, [form, mode])

  const clearLocalStorage = () => {
    localStorage.removeItem('customer_form')
    setForm({ ...defaultForm })
  }

  const handleDelete = async () => {
    try {
      await deleteCustomer(selectedCustomer.id, {
        onSuccess: () => {
          onClose()
          clearLocalStorage()
        },
      })
      showToast({
        crudItem: CRUDITEM.CUSTOMER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      })
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.CUSTOMER,
        crudType: CRUDTYPE.DELETE_ERROR,
      })
    }
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please enter a customer name.',
        status: TOASTSTATUS.ERROR,
      })
      nameRef.current?.focus()
      return
    }
    if (
      form.email !== '' &&
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please enter a valid email address.',
        status: TOASTSTATUS.ERROR,
      })
      emailRef.current?.focus()
      return
    }
    if (!form.phone) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please enter a phone number.',
        status: TOASTSTATUS.ERROR,
      })
      phoneRef.current?.focus()
      return
    }

    try {
      const payload = { ...form }

      if (mode === 'edit') {
        await updateCustomer(
          { id: selectedCustomer.id, customerData: payload },
          {
            onSuccess: () => {
              onClose()
            },
          }
        )
        showToast({
          crudItem: CRUDITEM.CUSTOMER,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        })
      } else {
        const newCustomer = await createCustomer(payload)

        showToast({
          crudItem: CRUDITEM.CUSTOMER,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        })

        clearLocalStorage()
        onClose()

        if (onCustomerCreated) {
          onCustomerCreated(newCustomer)
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Customer} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
        label="Customer Name"
          disabled={disabled}
          ref={nameRef}
          name="name"
          type="text"
          placeholder="Customer Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <InputField
        label="Email Address"
          ref={emailRef}
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          disabled={disabled}
          required
          type="email"
        />
        <PhoneNoField
          disabled={disabled}
          ref={phoneRef}
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <DoneByAutoCompleteWithAddOption
          placeholder="Select Done By"
          name="done_by_id"
          value={form.done_by_id}
          onChange={handleChange}
          disabled={disabled}
        />
        <CostCenterAutoCompleteWithAddOption
          placeholder="Select Cost Center"
          name="cost_center_id"
          value={form.cost_center_id}
          onChange={handleChange}
          disabled={disabled}
        />
        <InputFieldWithCalculator
          ref={creditLimitRef}
          name="credit_limit"
          placeholder="Credit Limit"
          value={form.credit_limit}
          onChange={handleChange}
          disabled={disabled}
          required
          type="number"
        />
        <InputFieldWithCalculator
          ref={outstandingBalanceRef}
          name="outstanding_balance"
          placeholder="Outstanding Balance"
          value={form.outstanding_balance}
          onChange={handleChange}
          disabled={disabled}
          required
          type="number"
        />
        <TextArea
          disabled={disabled}
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          required
        />
      </ModalBody>
      <ModalFooter
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}>
        {mode === 'add' && <CancelButton onClick={onClose} />}
        {mode === 'edit' && (
          <DeleteTextButton
            transaction={Transaction.Customer}
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

export default AddCustomer
