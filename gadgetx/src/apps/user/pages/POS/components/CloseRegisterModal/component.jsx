import React, { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalFooter, ModalBody } from '@/components/Modal'
import InputField from '@/components/InputField'
import SubmitButton from '@/apps/user/components/SubmitButton'
import CancelButton from '@/apps/user/components/CancelButton'
import { useToast } from '@/context/ToastContext'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import useCloseRegisterSession from '@/hooks/api/registerSession/useCloseRegisterSession'
import useRegisterSessionById from '@/hooks/api/registerSession/useRegisterSessionById'
import AmountSymbol from '@/components/AmountSymbol'
import Loader from '@/components/Loader'

import './style.scss'

const CloseRegisterModal = ({ isOpen, onClose, onKeepOpen, sessionId, onRegisterClosed }) => {
  const showToast = useToast()
  
  const defaultForm = {
    closing_cash: '',
    closing_note: ''
  }
  const [form, setForm] = useState({ ...defaultForm })

  // Fetch Session Data including Stats
  const { data: sessionData, isLoading: isFetchingStats } = useRegisterSessionById(sessionId)
  const { mutateAsync: closeSession, isPending: isClosing } = useCloseRegisterSession()

  useEffect(() => {
    if (isOpen) {
      setForm({ ...defaultForm })
    }
  }, [isOpen, sessionId])

  const handleSubmit = async () => {
    if (!sessionId) return

    try {
      await closeSession({
        id: sessionId,
        data: {
          closing_cash: parseFloat(form.closing_cash) || 0,
          closing_note: form.closing_note
        }
      })
      
      showToast({ 
        type: TOASTTYPE.GENARAL, 
        message: 'Register Closed Successfully', 
        status: TOASTSTATUS.SUCCESS 
      })
      
      if (onRegisterClosed) {
          onRegisterClosed()
      }
      onClose()
      
    } catch (error) {
      showToast({ 
        type: TOASTTYPE.GENARAL, 
        message: error.response?.data?.message || 'Failed to close register', 
        status: TOASTSTATUS.ERROR 
      })
    }
  }

  const stats = sessionData?.stats || {}
  const reconciliation = sessionData?.reconciliation || {}
  const expectedCash = reconciliation.expected_closing_cash || 0
  const currentDifference = (parseFloat(form.closing_cash) || 0) - expectedCash

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="register-modal"
      size="md"
    >
      <ModalHeader className="register-modal__header" >
        <h3 className='fs18'>Close Register</h3>
      </ModalHeader>
      
      <ModalBody className="register-modal__body">
        {isFetchingStats ? (
            <div style={{padding: '20px'}}><Loader /></div>
        ) : (
            <>
                <p className="modal-instruction fs16" style={{ fontSize: '1.05rem', marginBottom: '15px' }}>
                    Session: {sessionData?.session?.opened_at && new Date(sessionData.session.opened_at).toLocaleString()}
                </p>

                {/* Summary Box */}
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span className='fs12'>Opening Cash</span>
                        <strong><AmountSymbol>{sessionData?.session?.opening_cash || 0}</AmountSymbol></strong>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px',}}>
                        <span className='fs12'> Sales</span>
                        <span className='fs12'><AmountSymbol>{stats.sales_total || 0}</AmountSymbol></span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span className='fs12'> Returns</span>
                        <span className='fs12'><AmountSymbol>{stats.sale_return_total || 0}</AmountSymbol></span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span className='fs12'> Purchases</span>
                        <span className='fs12'><AmountSymbol>{stats.purchase_total || 0}</AmountSymbol></span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span className='fs12'> Purchase Returns</span>
                        <span className='fs12'><AmountSymbol>{stats.purchase_return_total || 0}</AmountSymbol></span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span className='fs12'> Cash In (Ledger)</span>
                        <span  className='fs12'><AmountSymbol>{stats.cash_in || 0}</AmountSymbol></span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                        <span className='fs12'> Cash Out (Ledger)</span>
                        <span className='fs12'><AmountSymbol>{stats.cash_out || 0}</AmountSymbol></span>
                    </div>
                    <hr style={{borderColor: '#cbd5e0', margin: '8px 0'}}/>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'16px', fontWeight: 'bold'}}>
                        <span className='fs12'>Expected Cash</span>
                        <span className='fs12'><AmountSymbol>{expectedCash}</AmountSymbol></span>
                    </div>
                </div>

                <div className="form-group fs14">
                    <InputField
                        label="Actual Closing Cash"
                        type="number"
                        placeholder="0.00"
                        value={form.closing_cash}
                        onChange={(e) => setForm(prev => ({ ...prev, closing_cash: e.target.value }))}
                        style={{ marginBottom: '15px' }}
                    />
                    
                    {form.closing_cash !== '' && (
                        <div style={{ 
                            marginBottom: '15px', 
                            padding: '8px', 
                            borderRadius: '4px',
                            textAlign: 'right',
                            background: currentDifference === 0 ? '#f0fdf4' : '#fef2f2',
                            color: currentDifference === 0 ? '#15803d' : '#b91c1c'
                        }}>
                            Difference: <AmountSymbol>{currentDifference}</AmountSymbol>
                        </div>
                    )}

                    <InputField
                        placeholder="Closing note"
                        value={form.closing_note}
                        onChange={(e) => setForm(prev => ({ ...prev, closing_note: e.target.value }))}
                    />
                </div>
            </>
        )}
      </ModalBody>

      <ModalFooter className="register-modal__footer">
         <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
             <CancelButton onClick={onClose} label="Cancel" className="cancel-btn" />
             
             {onKeepOpen && (
                 <SubmitButton 
                    label="Keep"
                    className="btn" 
                    style={{
                        padding: '8px 16px', 
                        borderRadius: '4px', 
                        border: '1px solid #cbd5e0', 
                        background: 'white', 
                        color: '#4a5568',
                        fontWeight: 500,
                        cursor: 'pointer'
                    }}
                    onClick={onKeepOpen}
                 >
                    No
                 </SubmitButton>
             )}
             
             <SubmitButton 
                onClick={handleSubmit} 
                label="Close" 
                isLoading={isClosing} 
                disabled={isFetchingStats}
                className="submit-btn"
             />
         </div>
      </ModalFooter>
    </Modal>
  )
}

export default CloseRegisterModal