import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import { useIsMobile } from '@/utils/useIsMobile'
import useCreatePayroll from '@/hooks/api/payroll/useCreatePayroll'
import useUpdatePayroll from '@/hooks/api/payroll/useUpdatePayroll'
import useDeletePayroll from '@/hooks/api/payroll/useDeletePayroll'
import useEmployees from '@/hooks/api/employee/useEmployees'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import DateField from '@/components/DateField'
import EmployeeAutoCompleteWithAddOption from '@/apps/user/components/EmployeeAutoCompleteWithAddOption'
import CostCenterAutoCompleteWithAddOption from '@/apps/user/components/CostCenterAutoCompleteWithAddOption'
import AccountAutoCompleteWithAddOptionWithBalance from '@/apps/user/components/AccountAutoCompleteWithAddOptionWithBalance'
import DoneByAutoCompleteWithAddOption from '@/apps/user/components/DoneByAutoCompleteWithAddOption' // Imported
import HStack from '@/components/HStack'
import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import DeleteTextButton from '@/apps/user/components/DeleteTextButton'
import PageTitle from '@/components/PageTitle'
import InputFieldWithCalculator from '@/apps/user/components/InputFieldWithCalculator'


const AddPayroll = ({ isOpen, onClose, mode, selectedPayroll, onSuccess }) => {
  const isMobile = useIsMobile()
  const showToast = useToast()
  const employeeSelectRef = useRef(null)
  const accountSelectRef = useRef(null)
  const salaryInputRef = useRef(null)
  const payDateRef = useRef(null)

  const defaultForm = {
    employee_id: '',
    account_id: '',
    salary: '',
    pay_date: new Date().toISOString().split('T')[0],
    cost_center_id: '',
    done_by_id: '', // Added done_by_id
  }

  const [form, setForm] = useState(defaultForm)
  const disabled = mode === 'view'

  const { mutateAsync: createPayroll, isPending: isCreating } =
    useCreatePayroll()
  const { mutateAsync: updatePayroll, isPending: isUpdating } =
    useUpdatePayroll()
  const { mutateAsync: deletePayroll, isPending: isDeleting } =
    useDeletePayroll()
  const { data: employeesData } = useEmployees()

  const employeeOptions = (employeesData || []).map((emp) => ({
    value: emp.id,
    label: emp.name,
  }))

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' || mode === 'view') {
        setForm({
          employee_id: selectedPayroll.employee_id || '',
          account_id: selectedPayroll.account_id || '',
          salary: selectedPayroll.salary || '',
          pay_date: selectedPayroll.pay_date
            ? new Date(selectedPayroll.pay_date).toISOString().split('T')[0]
            : '',
          cost_center_id: selectedPayroll.cost_center_id || '',
          done_by_id: selectedPayroll.done_by_id || '', // Load existing done_by
        })
      } else {
        const savedForm = localStorage.getItem('payroll_form')
        setForm(savedForm ? JSON.parse(savedForm) : defaultForm)
      }
      if (mode === 'add' || mode === 'edit') {
        setTimeout(() => employeeSelectRef.current?.focus(), 100)
      }
    }
  }, [isOpen, mode, selectedPayroll])

  useEffect(() => {
    if (mode === 'add') {
      localStorage.setItem('payroll_form', JSON.stringify(form))
    }
  }, [form, mode])

  const clearLocalStorage = () => {
    localStorage.removeItem('payroll_form')
    setForm(defaultForm)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.employee_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please select an employee.',
        status: TOASTSTATUS.ERROR,
      })
      employeeSelectRef.current?.focus()
      return
    }

    if (!form.account_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please select an account to pay from.',
        status: TOASTSTATUS.ERROR,
      })
      accountSelectRef.current?.focus()
      return
    }

    if (!form.salary) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please Enter Salary',
        status: TOASTSTATUS.ERROR,
      })
      salaryInputRef.current?.focus()
      return
    }

    if (!form.pay_date) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please select a pay date.',
        status: TOASTSTATUS.ERROR,
      })
      payDateRef.current?.focus()
      return
    }

    const payload = {
      ...form,
      salary: parseFloat(form.salary),
      cost_center_id: form.cost_center_id
        ? parseInt(form.cost_center_id, 10)
        : null,
      done_by_id: form.done_by_id ? parseInt(form.done_by_id, 10) : null, // Parse Done By
    }

    try {
      if (mode === 'edit') {
        await updatePayroll(
          { id: selectedPayroll.id, payrollData: payload },
          {
            onSuccess: () => {
              showToast({
                crudItem: CRUDITEM.PAYROLL,
                crudType: CRUDTYPE.UPDATE_SUCCESS,
              })
              onSuccess()
              onClose()
            },
          },
        )
      } else {
        await createPayroll(payload, {
          onSuccess: () => {
            showToast({
              crudItem: CRUDITEM.PAYROLL,
              crudType: CRUDTYPE.CREATE_SUCCESS,
            })
            onSuccess()
            onClose()
            clearLocalStorage()
          },
        })
      }
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: err.response?.data?.error || 'An unexpected error occurred.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedPayroll?.id) return
    try {
      await deletePayroll(selectedPayroll.id, {
        onSuccess: () => {
          showToast({
            crudItem: CRUDITEM.PAYROLL,
            crudType: CRUDTYPE.DELETE_SUCCESS,
          })
          onSuccess()
          onClose()
          clearLocalStorage()
        },
      })
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || 'Failed to delete payroll.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  const getModalTitle = () => {
    if (mode === 'add') return 'Add Payroll Record'
    if (mode === 'edit') return 'Edit Payroll Record'
    return 'View Payroll Record'
  }

  const employeeField = (
    <EmployeeAutoCompleteWithAddOption
      ref={employeeSelectRef}
      placeholder="Select Employee"
      options={employeeOptions}
      value={form.employee_id}
      onChange={(e) => handleChange('employee_id', e.target.value)}
      disabled={disabled}
      required
    />
  )

  const accountField = (
    <AccountAutoCompleteWithAddOptionWithBalance
      ref={accountSelectRef}
      name="account_id"
      value={form.account_id}
      onChange={(e) => handleChange('account_id', e.target.value)}
      disabled={disabled}
      required
      placeholder="Select Account"
      debitAmount={form.salary}
    />
  )

  const costCenterField = (
    <CostCenterAutoCompleteWithAddOption
      name="cost_center_id"
      value={form.cost_center_id}
      onChange={(e) => handleChange('cost_center_id', e.target.value)}
      disabled={disabled}
    />
  )

  const doneByField = (
    <DoneByAutoCompleteWithAddOption
      name="done_by_id"
      placeholder="Done By"
      value={form.done_by_id}
      onChange={(e) => handleChange('done_by_id', e.target.value)}
      disabled={disabled}
    />
  )

  const salaryField = (
    <InputFieldWithCalculator
      label="Salary"
      ref={salaryInputRef}
      type="number"
      placeholder="0.00"
      value={form.salary}
      onChange={(e) => handleChange('salary', e.target.value)}
      disabled={disabled}
      required
    />
  )

  const dateField = (
    <DateField
      ref={payDateRef}
      label="Pay Date"
      value={form.pay_date ? new Date(form.pay_date) : null}
      onChange={(date) =>
        handleChange(
          'pay_date',
          date ? date.toISOString().split('T')[0] : '',
        )
      }
      disabled={disabled}
      required
    />
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <PageTitle title={getModalTitle()} />
      </ModalHeader>
      <ModalBody>
        {isMobile ? (
          <>
            {dateField}
            {employeeField}
            {accountField}
            {costCenterField}
            {doneByField}
            {salaryField}
          </>
        ) : (
          <>
            {employeeField}
            {accountField}
            {/* <HStack> */}
              {costCenterField}
              {doneByField}
            {/* </HStack> */}
            <HStack>
              {salaryField}
              {dateField}
            </HStack>
          </>
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
        {mode === 'add' && <CancelButton onClick={onClose} />}
        {mode === 'edit' && (
          <DeleteTextButton
            transaction="Payroll"
            onDelete={handleDelete}
            isLoading={isDeleting}
          />
        )}
        {mode !== 'view' && (
          <SubmitButton
            isLoading={isCreating || isUpdating}
            disabled={disabled}
            type={mode}
            onClick={handleSubmit}
          />
        )}
      </ModalFooter>
    </Modal>
  )
}

export default AddPayroll