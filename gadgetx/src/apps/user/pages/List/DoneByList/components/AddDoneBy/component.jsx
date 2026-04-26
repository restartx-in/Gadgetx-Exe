import { useState, useEffect, useRef } from 'react'
import InputField from '@/components/InputField'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import { Transaction } from '@/constants/object/transaction'
import Title from '@/apps/user/components/Title'
import { Report } from '@/constants/object/report'
import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import DeleteTextButton from '@/apps/user/components/DeleteTextButton'

import { useCreateDoneBy } from '@/hooks/api/doneBy/useCreateDoneBy'
import { useUpdateDoneBy } from '@/hooks/api/doneBy/useUpdateDoneBy'
import { useDeleteDoneBy } from '@/hooks/api/doneBy/useDeleteDoneBy'


const AddDoneBy = ({ isOpen, onClose, mode, selectedDoneBy, onDoneByCreated }) => {
  const showToast = useToast()
  const nameInputRef = useRef(null)
  const defaultForm = {
    name: '',
  }

  const [form, setForm] = useState({ ...defaultForm })
  const disabled = mode === 'view'

  const { mutateAsync: createDoneBy, isLoading: creating } = useCreateDoneBy()
  const { mutateAsync: updateDoneBy, isLoading: updating } = useUpdateDoneBy()
  const { mutateAsync: deleteDoneBy, isLoading: deleting } = useDeleteDoneBy()

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' || mode === 'view') {
        setForm({ ...defaultForm, ...selectedDoneBy })
      } else if (mode === 'add') {
        if (selectedDoneBy?.name) {
          setForm({ ...defaultForm, name: selectedDoneBy.name })
          localStorage.removeItem('done_by_form')
        } else {
          const savedForm = localStorage.getItem('done_by_form')
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm })
        }
      }
      if (mode === 'add' || mode === 'edit') {
        setTimeout(() => nameInputRef.current?.focus(), 100)
      }
    }
  }, [isOpen, mode, selectedDoneBy])

  useEffect(() => {
    if (mode === 'add') {
      localStorage.setItem('done_by_form', JSON.stringify(form))
    }
  }, [form, mode])

  const clearLocalStorage = () => {
    localStorage.removeItem('done_by_form')
    setForm({ ...defaultForm })
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please Enter Done By name.',
        status: TOASTSTATUS.ERROR,
      })
      nameInputRef.current?.focus()
      return
    }

    try {
      const payload = { ...form }

      if (mode === 'edit') {
        await updateDoneBy(
          { id: selectedDoneBy.id, data: payload },
          {
            onSuccess: () => {
              onClose()
            },
          },
        )
        showToast({
          crudItem: CRUDITEM.DoneBy,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        })
      } else {
        const newDoneBy = await createDoneBy(payload);
        
        showToast({
          crudItem: CRUDITEM.DoneBy,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        
        clearLocalStorage();
        onClose();

        if (onDoneByCreated) {
          onDoneByCreated(newDoneBy);
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
      await deleteDoneBy(selectedDoneBy.id, {
        onSuccess: () => {
          onClose()
          clearLocalStorage()
        },
      })
      showToast({
        crudItem: CRUDITEM.DoneBy,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      })
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          error.response?.data?.error || 'Failed to delete Done By.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <ModalHeader>
        <Title report={Report.DoneBy} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
          label="Done By Name"
          ref={nameInputRef}
          disabled={disabled}
          name="name"
          type="text"
          placeholder="Done By Name"
          value={form.name}
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
        }}
      >
        {mode === 'add' && <CancelButton onClick={onClose} />}
        {mode === 'edit' && (
          <DeleteTextButton
            transaction={Transaction.DoneBy}
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

export default AddDoneBy