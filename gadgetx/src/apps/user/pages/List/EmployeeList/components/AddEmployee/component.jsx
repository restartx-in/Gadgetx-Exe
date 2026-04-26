
import { useState, useEffect, useRef } from 'react'
import useDeleteEmployee from '@/hooks/api/employee/useDeleteEmployee'
import useCreateEmployee from '@/hooks/api/employee/useCreateEmployee'
import useUpdateEmployee from '@/hooks/api/employee/useUpdateEmployee'
import InputField from '@/components/InputField'
import { useIsMobile } from '@/utils/useIsMobile'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import { Transaction } from '@/constants/object/transaction'
import TextArea from '@/components/TextArea'
import PhoneNoField from '@/components/PhoneNoField'
import Title from '@/apps/user/components/Title'
import { Report } from '@/constants/object/report'
import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import DeleteTextButton from '@/apps/user/components/DeleteTextButton'
import DateField from '@/components/DateField'
import InputFieldWithCalculator from '@/apps/user/components/InputFieldWithCalculator'
import HStack from '@/components/HStack'
import DoneByAutoCompleteWithAddOption from '@/apps/user/components/DoneByAutoCompleteWithAddOption'
import CostCenterAutoCompleteWithAddOption from '@/apps/user/components/CostCenterAutoCompleteWithAddOption'
import EmployeePositionAutoCompleteWithAddOption from '@/apps/user/components/EmployeePositionAutoCompleteWithAddOption'


const AddEmployee = ({
  isOpen,
  onClose,
  mode,
  selectedEmployee,
  onSuccess,
}) => {
  const showToast = useToast()
  const nameInputRef = useRef(null)
  const emailInputRef = useRef(null)
  const phoneInputRef = useRef(null)
  const positionInputRef = useRef(null)
  const salaryInputRef = useRef(null)

  const defaultForm = {
    name: '',
    email: '',
    phone: '',
    employee_position_id: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    address: '',
    done_by_id: '',
    cost_center_id: '',
  }

  const isMobile = useIsMobile()
  const [form, setForm] = useState({ ...defaultForm })
  const disabled = mode === 'view'

  const { mutateAsync: createEmployee, isLoading: creating } = useCreateEmployee()
  const { mutateAsync: updateEmployee, isLoading: updating } = useUpdateEmployee()
  const { mutateAsync: deleteEmployee, isLoading: deleting } = useDeleteEmployee()

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'edit' || mode === 'view') && selectedEmployee) {
        setForm({
          ...defaultForm,
          ...selectedEmployee,
        })
      } else if (mode === 'add') {
        const savedForm = localStorage.getItem('employee_form')
        const localForm = savedForm ? JSON.parse(savedForm) : { ...defaultForm }
        
        const prefilledName = selectedEmployee?.name || ''; 

        setForm({
            ...localForm,
            name: prefilledName || localForm.name,
        })
      }

      if (mode !== 'view') {
        setTimeout(() => nameInputRef.current?.focus(), 100)
      }
    } else {
      setForm({ ...defaultForm })
    }
  }, [isOpen, mode, selectedEmployee]) // Dependency array must include selectedEmployee

  useEffect(() => {
    if (mode === 'add' && isOpen) {
      localStorage.setItem('employee_form', JSON.stringify(form))
    }
  }, [form, mode, isOpen])

  const clearLocalStorage = () => {
    localStorage.removeItem('employee_form')
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })
  const handleFormDateChange = (newDate) => {
    setForm({
      ...form,
      hire_date: newDate ? newDate.toISOString().split('T')[0] : '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please Enter Employee name.', status: TOASTSTATUS.ERROR })
      nameInputRef.current?.focus()
      return
    }
    if (!form.email) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please Enter Email', status: TOASTSTATUS.ERROR })
      emailInputRef.current?.focus()
      return
    }
    if (!form.phone) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please Enter Phone Number', status: TOASTSTATUS.ERROR })
      phoneInputRef.current?.focus()
      return
    }
    if (!form.employee_position_id) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please select a position.', status: TOASTSTATUS.ERROR })
      positionInputRef.current?.focus()
      return
    }
    if (!form.salary) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please Enter Salary', status: TOASTSTATUS.ERROR })
      salaryInputRef.current?.focus()
      return
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        employee_position_id: form.employee_position_id || null, 
        salary: form.salary,
        hire_date: form.hire_date,
        done_by_id: form.done_by_id || null, 
        cost_center_id: form.cost_center_id || null, 
      }

      let responseData;

      if (mode === 'edit') {
        const response = await updateEmployee({ id: selectedEmployee.id, employeeData: payload })
        responseData = response.data;
        showToast({
          crudItem: CRUDITEM.EMPLOYEE,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        })
      } else {
        const response = await createEmployee(payload)
        responseData = response.data;
        showToast({
          crudItem: CRUDITEM.EMPLOYEE,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        })
        clearLocalStorage()
      }
      onSuccess(responseData) 
      onClose()
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || 'An unexpected error occurred.'
      showToast({
        type: TOASTTYPE.GENARAL,
        message: errorMsg,
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedEmployee) return
    try {
      await deleteEmployee(selectedEmployee.id)
      showToast({
        crudItem: CRUDITEM.EMPLOYEE,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      })
      onSuccess()
      onClose()
      clearLocalStorage()
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || 'Failed to delete employee.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Employee} mode={mode} />
      </ModalHeader>
      <ModalBody>
        {isMobile && (
          <DateField
            label="Hire Date"
            value={form.hire_date ? new Date(form.hire_date) : null}
            onChange={handleFormDateChange}
            disabled={disabled}
          />
        )}
        <InputField
        label="Employee Name"
          ref={nameInputRef}
          disabled={disabled}
          name="name"
          type="text"
          placeholder="Employee Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <InputField
          label="Email"
          ref={emailInputRef}
          disabled={disabled}
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <PhoneNoField
          label="Phone"
          ref={phoneInputRef}
          disabled={disabled}
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
        <TextArea
          label="Address"
          disabled={disabled}
          name="address"
          // placeholder="Address"
          value={form.address}
          onChange={handleChange}
        />
        {/* --- REPLACED Select with new Autocomplete Component --- */}
        <EmployeePositionAutoCompleteWithAddOption
          ref={positionInputRef}
          placeholder="Select Position"
          name="employee_position_id"
          value={form.employee_position_id}
          onChange={handleChange}
          disabled={disabled}
          required
        />
        {isMobile ? (
          <InputFieldWithCalculator
          label="Salary"
            ref={salaryInputRef}
            disabled={disabled}
            name="salary"
            type="number"
            // placeholder="Salary"
            value={form.salary}
            onChange={handleChange}
            required
          />
        ) : (
          <HStack>
            <InputFieldWithCalculator
            label="Salary"
              ref={salaryInputRef}
              disabled={disabled}
              name="salary"
              type="number"
              // placeholder="Salary"
              value={form.salary}
              onChange={handleChange}
              required
            />
            <DateField
              label="Hire Date"
              value={form.hire_date ? new Date(form.hire_date) : null}
              onChange={handleFormDateChange}
              disabled={disabled}
            />
          </HStack>
        )}
      </ModalBody>
      <ModalFooter
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}
      >
        {mode !== 'edit' && <CancelButton onClick={onClose} />}
        {mode === 'edit' && (
          <DeleteTextButton
            transaction={Transaction.Employee}
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        {mode !== 'view' && (
          <SubmitButton
            isLoading={creating || updating}
            disabled={disabled}
            type={mode}
            onClick={handleSubmit}
          />
        )}
      </ModalFooter>
    </Modal>
  )
}

export default AddEmployee
