import { useState, useEffect, useRef } from 'react'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import Select from '@/components/Select'
import TextArea from '@/components/TextArea'
import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import AccountAutoCompleteWithAddOption from '@/apps/user/components/AccountAutoCompleteWithAddOption'
import AccountAutoCompleteWithAddOptionWithBalance from '@/apps/user/components/AccountAutoCompleteWithAddOptionWithBalance'
import DoneByAutoCompleteWithAddOption from '@/apps/user/components/DoneByAutoCompleteWithAddOption'
import CostCenterAutoCompleteWithAddOption from '@/apps/user/components/CostCenterAutoCompleteWithAddOption'
import useCreateCashBook from '@/hooks/api/cashBook/useCreateCashBook'
import useUpdateCashBook from '@/hooks/api/cashBook/useUpdateCashBook'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import Title from '@/apps/user/components/Title'
import { Report } from '@/constants/object/report'
import InputFieldWithCalculator from '@/apps/user/components/InputFieldWithCalculator'

const transactionTypeOptions = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer', label: 'Transfer' },
]

const CashBook = ({ isOpen, onClose, mode, selectedEntry, onSuccess }) => {
  const showToast = useToast()

  const accountSelectRef = useRef(null)
  const toAccountSelectRef = useRef(null)
  const transactionTypeRef = useRef(null)
  const amountRef = useRef(null) // Unified ref for amount input

  const defaultForm = {
    account_id: '',
    to_account_id: '',
    transaction_type: '',
    description: '',
    amount: '', // Unified amount field
    done_by_id: '',
    cost_center_id: '',
  }

  const [form, setForm] = useState(defaultForm)
  const [fromAccountBalance, setFromAccountBalance] = useState(null)
  const disabled = mode === 'view'

  const { mutateAsync: createTransaction, isLoading: creating } =
    useCreateCashBook()
  const { mutateAsync: updateTransaction, isLoading: updating } =
    useUpdateCashBook()

  const clearLocalStorage = () => {
    localStorage.removeItem('add_cashbook_form')
  }

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' || mode === 'view') {
        // Logic to populate form from selectedEntry based on transaction type
        let amount = ''
        let type = selectedEntry.transaction_type

        // Determine amount based on debit/credit from the list view data
        if (selectedEntry.debit > 0) {
            amount = selectedEntry.debit
        } else if (selectedEntry.credit > 0) {
            amount = selectedEntry.credit
        }

        setForm({
          ...defaultForm,
          ...selectedEntry,
          transaction_type: type,
          amount: amount,
          // Ensure IDs are strings/numbers as expected by selects
          account_id: selectedEntry.account_id || (selectedEntry.from_account_id) || '', 
          to_account_id: selectedEntry.to_account_id || '', 
        })
      } else {
        if (selectedEntry && Object.keys(selectedEntry).length > 0) {
           // Pre-fill if triggered from "Deposit/Withdraw" buttons on Account List
           // Logic: If account_id is passed, set it.
           const preFill = { ...defaultForm, ...selectedEntry };
           // Ensure amount is reset if just opening blank
           if(!selectedEntry.amount) preFill.amount = '';
           setForm(preFill)
           clearLocalStorage()
        } else {
          const savedForm = localStorage.getItem('add_cashbook_form')
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm })
        }
      }

      if (mode !== 'view') {
        setTimeout(() => transactionTypeRef.current?.focus(), 100)
      }
    } else {
      setFromAccountBalance(null)
    }
  }, [mode, selectedEntry, isOpen])

  useEffect(() => {
    if (
      isOpen &&
      mode === 'add' &&
      (!selectedEntry || Object.keys(selectedEntry).length === 0)
    ) {
      localStorage.setItem('add_cashbook_form', JSON.stringify(form))
    }
  }, [form, isOpen, mode, selectedEntry])

  const handleChange = (e) => {
    const { name, value, selectedOption } = e.target
    
    setForm((prevForm) => {
      const newForm = { ...prevForm, [name]: value }

      if (name === 'transaction_type') {
        newForm.amount = ''
        newForm.account_id = ''
        newForm.to_account_id = ''
        setFromAccountBalance(null)
      } else if (name === 'account_id') {
        if (selectedOption) {
          setFromAccountBalance(selectedOption.amount) // Assuming option has amount
        } else {
          setFromAccountBalance(null)
        }
      } 
      return newForm
    })
  }

  const handleTransferAmountChange = (e) => {
    const { name, value } = e.target
    const balance = fromAccountBalance ?? 0
    const numericValue = Number(value)

    // Optional: Client-side validation for transfers/withdrawals exceeding balance
    if (
      (form.transaction_type === 'transfer' || form.transaction_type === 'withdrawal') && 
      numericValue > balance && 
      balance !== null
    ) {
       // You might want to just show a toast or error state rather than blocking input completely
       // keeping blocking for now based on previous logic
       showToast({
        type: TOASTTYPE.GENARAL,
        message: `Amount cannot exceed account balance of ${balance.toLocaleString()}`,
        status: TOASTSTATUS.ERROR,
      })
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.transaction_type) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please choose a transaction type.', status: TOASTSTATUS.ERROR })
      transactionTypeRef.current?.focus()
      return
    }

    if (form.transaction_type === 'transfer') {
      if (!form.account_id) {
        showToast({ type: TOASTTYPE.GENARAL, message: 'Please select the account to transfer from.', status: TOASTSTATUS.ERROR })
        accountSelectRef.current?.focus()
        return
      }
      if (!form.amount) {
        showToast({ type: TOASTTYPE.GENARAL, message: 'Please enter the amount to transfer.', status: TOASTSTATUS.ERROR })
        amountRef.current?.focus()
        return
      }
      if (!form.to_account_id) {
        showToast({ type: TOASTTYPE.GENARAL, message: 'Please select the account to transfer to.', status: TOASTSTATUS.ERROR })
        toAccountSelectRef.current?.focus()
        return
      }
      if (form.account_id === form.to_account_id) {
        showToast({ type: TOASTTYPE.GENARAL, message: 'From and To accounts cannot be the same.', status: TOASTSTATUS.ERROR })
        toAccountSelectRef.current?.focus()
        return
      }
    } else {
      // Deposit, Withdrawal, Brokerage
      if (!form.account_id) {
        showToast({ type: TOASTTYPE.GENARAL, message: 'Please select an account.', status: TOASTSTATUS.ERROR })
        accountSelectRef.current?.focus()
        return
      }
      if (!form.amount) {
        showToast({ type: TOASTTYPE.GENARAL, message: 'Please enter the amount.', status: TOASTSTATUS.ERROR })
        amountRef.current?.focus()
        return
      }
    }

    try {
      let finalDescription = form.description
      if (form.transaction_type === 'transfer' && !form.description?.trim()) {
        finalDescription = 'Fund Transfer'
      }

      // Construct Payload matching the new Transaction API
      const payload = {
        transaction_type: form.transaction_type,
        amount: Number(form.amount),
        description: finalDescription,
        done_by_id: form.done_by_id || null,
        cost_center_id: form.cost_center_id || null,
      }

      // Handle specific fields based on type
      if (form.transaction_type === 'transfer') {
          payload.from_account_id = form.account_id;
          payload.to_account_id = form.to_account_id;
      } else {
          payload.account_id = form.account_id;
      }

      const handleSuccess = () => {
        onClose()
        if (onSuccess) onSuccess()
      }

      if (mode === 'edit') {
        // Note: Update might be restricted depending on backend implementation for 'reference' based edits
        // but assuming updateTransaction maps correctly.
        await updateTransaction({ id: selectedEntry.id, data: payload }, { onSuccess: handleSuccess })
        showToast({ crudItem: CRUDITEM.CASHBOOK, crudType: CRUDTYPE.UPDATE_SUCCESS })
      } else {
        await createTransaction(payload, {
          onSuccess: () => {
            handleSuccess()
            clearLocalStorage()
          },
        })
        showToast({ crudItem: CRUDITEM.CASHBOOK, crudType: CRUDTYPE.CREATE_SUCCESS })
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'An unexpected error occurred.'
      showToast({ type: TOASTTYPE.GENARAL, message: errorMsg, status: TOASTSTATUS.ERROR })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.CashBook} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <Select
         label="Transaction Type"
          ref={transactionTypeRef}
          disabled={disabled || mode === 'edit'}
          name="transaction_type"
          value={form.transaction_type}
          onChange={handleChange}
          options={transactionTypeOptions}
          placeholder="Select Transaction Type"
          required
        />

        {(form.transaction_type === 'withdrawal') && (
          <>
            <InputFieldWithCalculator
             label="Amount"
              ref={amountRef}
              disabled={disabled}
              name="amount"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange} 
            />
            <AccountAutoCompleteWithAddOptionWithBalance
              ref={accountSelectRef}
              disabled={disabled || !form.amount || Number(form.amount) <= 0}
              name="account_id"
              value={form.account_id}
              onChange={handleChange}
              required
              debitAmount={form.amount} // Pass amount to check against balance
            />
          </>
        )}

        {form.transaction_type === 'deposit' && (
          <>
             <InputFieldWithCalculator
              label="Amount"
              ref={amountRef}
              disabled={disabled}
              name="amount"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
            />
            <AccountAutoCompleteWithAddOption
              ref={accountSelectRef}
              disabled={disabled || !form.amount || Number(form.amount) <= 0}
              name="account_id"
              value={form.account_id}
              onChange={handleChange}
              required
            />
          </>
        )}

        {/* TRANSFER: Source (Balance Check) -> Destination */}
        {form.transaction_type === 'transfer' && (
          <>
            <AccountAutoCompleteWithAddOptionWithBalance
              ref={accountSelectRef}
              disabled={disabled}
              name="account_id"
              value={form.account_id}
              onChange={handleChange}
              required
              placeholder="Select From Account"
            />
            <InputFieldWithCalculator
              label="Amount"
              ref={amountRef}
              disabled={disabled || !form.account_id}
              name="amount"
              placeholder="Amount to Transfer"
              value={form.amount}
              onChange={handleTransferAmountChange} // Specific handler to check source balance
            />
            <AccountAutoCompleteWithAddOption
              ref={toAccountSelectRef}
              disabled={disabled || !form.amount || Number(form.amount) <= 0}
              name="to_account_id"
              value={form.to_account_id}
              onChange={handleChange}
              required
              placeholder="Select To Account"
            />
          </>
        )}

        <DoneByAutoCompleteWithAddOption
          placeholder="Done By (Optional)"
          name="done_by_id"
          value={form.done_by_id}
          onChange={handleChange}
          disabled={disabled}
        />
        <CostCenterAutoCompleteWithAddOption
          placeholder="Cost Center (Optional)"
          name="cost_center_id"
          value={form.cost_center_id}
          onChange={handleChange}
          disabled={disabled}
        />
        <TextArea
          label="Description"
          disabled={disabled}
          name="description"
          // placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
      </ModalBody>
      <ModalFooter
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}
      >
        <CancelButton onClick={onClose} />
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

export default CashBook