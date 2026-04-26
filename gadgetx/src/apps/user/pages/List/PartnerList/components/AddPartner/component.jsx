import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useDeletePartner from '@/hooks/api/partner/useDeletePartner'
import useCreatePartner from '@/hooks/api/partner/useCreatePartner'
import useUpdatePartner from '@/hooks/api/partner/useUpdatePartner'
import usePartnership from '@/hooks/api/partnership/usePartnership'
import useDeletePartnership from '@/hooks/api/partnership/useDeletePartnership'
import useDeleteAccount from '@/hooks/api/account/useDeleteAccount'
import usePartnerById from '@/hooks/api/partner/usePartnerById'
import DoneByAutoCompleteWithAddOption from '@/apps/user/components/DoneByAutoCompleteWithAddOption';
import CostCenterAutoCompleteWithAddOption from '@/apps/user/components/CostCenterAutoCompleteWithAddOption';
import InputField from '@/components/InputField'
import {
  TableS,
  TheadS,
  TbodyS,
  TrS,
  TdS,
  ThS,
  TdNumericS,
  ThMenuS,
  TableCaptionS,
  TdDateS,
} from '@/components/TableS'
import ThreeDotMenu from '@/components/ThreeDotMenu'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/Modal'
import PartnershipModal from '@/components/PartnershipModal'
import AddAccount from '@/apps/user/pages/List/AccountList/components/AddAccount'
import { Tabs, Tab, TabList, TabPanel, TabPanels } from '@/components/Tabs'
import { Transaction } from '@/constants/object/transaction'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import VStack from '@/components/VStack'
import HStack from '@/components/HStack'
import TextArea from '@/components/TextArea'
import Select from '@/components/Select'
import Title from '@/apps/user/components/Title'
import DeleteTextButton from '@/apps/user/components/DeleteTextButton'
import CancelButton from '@/apps/user/components/CancelButton'
import SubmitButton from '@/apps/user/components/SubmitButton'
import { Report } from '@/constants/object/report'
import SwitchButton from '@/components/SwitchButton'
import Loader from '@/components/Loader'
import PhoneNoField from '@/components/PhoneNoField'
import './style.scss'

const DRAFT_STORAGE_KEY = 'partner_form_draft'

const accountTypes = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
]

const AddPartner = ({ isOpen, onClose, mode, selectedPartner, onSuccess }) => {
  const showToast = useToast()
  const queryClient = useQueryClient()
  const nameInputRef = useRef(null)
  const phoneInputRef = useRef(null)

  const defaultForm = { name: '', phone: '', address: '', done_by_id: '', cost_center_id: '', accounts: [] }

  const [form, setForm] = useState({ ...defaultForm })
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false)
  const [partnershipMode, setPartnershipMode] = useState('add')
  const [selectedPartnership, setSelectedPartnership] = useState(null)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [accountMode, setAccountMode] = useState('add')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [tabIndex, setTabIndex] = useState(0)
  const [showAddAccounts, setShowAddAccounts] = useState(false)

  const partnerId = mode !== 'add' ? selectedPartner?.id : null

  const { data: partnershipData, isLoading: isLoadingPartnerships } = usePartnership({
    partner_id: partnerId,
    enabled: !!partnerId,
  })

  const { data: partnerDetails, isLoading: isLoadingDetails } =
    usePartnerById(partnerId)

  const disabled = mode === 'view'
  const { mutateAsync: deletePartner, isLoading: deleting } = useDeletePartner()
  const { mutateAsync: createPartner, isLoading: creating } = useCreatePartner()
  const { mutateAsync: updatePartner, isLoading: updating } = useUpdatePartner()
  const { mutateAsync: deletePartnership } = useDeletePartnership()
  const { mutateAsync: deleteAccount } = useDeleteAccount()

  const resetFormAndState = () => {
    setForm({ ...defaultForm })
    setShowAddAccounts(false)
    setTabIndex(0)
  }

  const clearLocalStorageAndResetForm = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    resetFormAndState()
  }

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' || mode === 'view') {
        const initialData = { ...defaultForm, ...selectedPartner };
        const finalData = partnerDetails ? { ...initialData, ...partnerDetails } : initialData;
        setForm(finalData);
        setTabIndex(0);
      } else if (mode === 'add') {
        const savedData = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          const { showAddAccounts: savedSwitchState, ...formData } = parsedData
          setForm(formData || defaultForm)
          setShowAddAccounts(savedSwitchState || false)
        } else {
          resetFormAndState()
        }
      }
      if (mode === 'add' || mode === 'edit') {
        setTimeout(() => nameInputRef.current?.focus(), 100)
      }
    }
  }, [isOpen, mode, selectedPartner, partnerDetails])


  useEffect(() => {
    if (mode === 'add') {
      const dataToSave = { ...form, showAddAccounts }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(dataToSave))
    }
  }, [form, showAddAccounts, mode])

  const handleAccountSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ['partner', selectedPartner.id],
    });
    setIsAccountModalOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedPartner) return
    try {
      await deletePartner(selectedPartner.id)
      showToast({
        crudItem: CRUDITEM.PARTNER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || 'Failed to delete partner.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  const handleDeletePartnership = async (partnershipId) => {
    try {
      await deletePartnership(partnershipId)
      showToast({ crudItem: 'Partnership', crudType: CRUDTYPE.DELETE_SUCCESS })
      queryClient.invalidateQueries({
        queryKey: ['partner', selectedPartner.id],
      })
    } catch (error) {
      showToast({ crudItem: 'Partnership', crudType: CRUDTYPE.DELETE_ERROR })
    }
  }

  const handleEditPartnershipClick = (partnership) => {
    setSelectedPartnership(partnership)
    setPartnershipMode('edit')
    setIsPartnershipModalOpen(true)
  }

  const handleViewPartnershipClick = (partnership) => {
    setSelectedPartnership(partnership)
    setPartnershipMode('view')
    setIsPartnershipModalOpen(true)
  }

  const handleAccountDelete = async (accountId) => {
    try {
      await deleteAccount(accountId)
      showToast({ crudItem: 'Account', crudType: CRUDTYPE.DELETE_SUCCESS })
      queryClient.invalidateQueries({
        queryKey: ['partner', selectedPartner.id],
      })
    } catch (error) {
      showToast({ crudItem: 'Account', crudType: CRUDTYPE.DELETE_ERROR })
    }
  }

  const handleEditAccountClick = (account) => {
    setSelectedAccount(account)
    setAccountMode('edit')
    setIsAccountModalOpen(true)
  }

  const handleViewAccountClick = (account) => {
    setSelectedAccount(account)
    setAccountMode('view')
    setIsAccountModalOpen(true)
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleAccountChange = (index, event) => {
    const newAccounts = [...form.accounts]
    newAccounts[index][event.target.name] = event.target.value
    setForm({ ...form, accounts: newAccounts })
  }

  const addAccount = () => {
    setForm((prevForm) => ({
      ...prevForm,
      accounts: [
        ...prevForm.accounts,
        { name: '', type: 'cash', description: '' },
      ],
    }))
  }

  const removeAccount = (index) => {
    const newAccounts = form.accounts.filter((_, i) => i !== index)
    setForm({ ...form, accounts: newAccounts })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please Enter Partner Name',
        status: TOASTSTATUS.ERROR,
      })
      nameInputRef.current?.focus()
      return
    }

    if (!form.phone) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please Enter Phone Number',
        status: TOASTSTATUS.ERROR,
      })
      phoneInputRef.current?.focus()
      return
    }

    if (mode === 'add' && showAddAccounts && form.accounts.some(acc => !acc.name || !acc.name.trim())) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Please provide a name for each new account.',
        status: TOASTSTATUS.ERROR,
      })
      return
    }

    const payload = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      done_by_id: form.done_by_id || null,
      cost_center_id: form.cost_center_id || null,
    }
    if (mode === 'add' && showAddAccounts && form.accounts.length > 0) {
      payload.addAccount = true
      payload.accounts = form.accounts.filter(acc => acc.name && acc.name.trim())
    }

    try {
      if (mode === 'edit') {
        await updatePartner({ id: selectedPartner.id, data: payload })
        showToast({
          crudItem: CRUDITEM.PARTNER,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        })
      } else {
        await createPartner(payload)
        showToast({
          crudItem: CRUDITEM.PARTNER,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        clearLocalStorageAndResetForm();
      }
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || 'An unexpected error occurred.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          <Title report={Report.Partner} mode={mode} />
        </ModalHeader>
        <ModalBody>
          {mode === 'add' ? (
            <MainTab
              handleSubmit={handleSubmit}
              disabled={disabled}
              handleChange={handleChange}
              form={form}
              mode={mode}
              handleAccountChange={handleAccountChange}
              addAccount={addAccount}
              removeAccount={removeAccount}
              showAddAccounts={showAddAccounts}
              onShowAddAccountsChange={setShowAddAccounts}
              nameInputRef={nameInputRef}
              phoneInputRef={phoneInputRef}
            />
          ) : (
            <Tabs index={tabIndex} onChange={setTabIndex}>
              <TabList>
                <Tab>Partner Details</Tab>
                <Tab>Partnership Details</Tab>
                <Tab>Accounts</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <MainTab
                    disabled={disabled}
                    handleChange={handleChange}
                    form={form}
                    mode={mode}
                    nameInputRef={nameInputRef}
                    phoneInputRef={phoneInputRef}
                  />
                </TabPanel>
                <TabPanel>
                  {isLoadingPartnerships ? <Loader /> : (
                    <div className="add_partner__details_card">
                      {partnershipData && partnershipData.length > 0 ? (
                        <>
                          <div className="add_partner__details_card-summary_cards ">
                            <div className="summary_cards-summary_card box-shadow fs12fw500">
                              <p>Total Contribution: {partnershipData.reduce((total, p) => total + Number(p.contribution || 0),0).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="summary_cards-summary_card box-shadow fs12fw500">
                              <p>Total Partnerships:{partnershipData.length}</p>
                            </div>
                          </div>
                          <div className="add_partner__details_card-table_container">
                            <TableS>
                              <TheadS>
                                <TrS>
                                  <ThS>Date</ThS>
                                  <ThS>Contribution</ThS>
                                  <ThS>Profit Share</ThS>
                                  <ThMenuS />
                                </TrS>
                              </TheadS>
                              <TbodyS>
                                {partnershipData.map((p) => (
                                  <TrS key={p.id}>
                                    <TdDateS>{p.created_at}</TdDateS>
                                    <TdNumericS>{p.contribution}</TdNumericS>
                                    <TdNumericS>{p.profit_share}</TdNumericS>
                                    <ThreeDotMenu
                                      onView={() => handleViewPartnershipClick(p)}
                                      onEdit={() => handleEditPartnershipClick(p)}
                                      onDelete={() => handleDeletePartnership(p.id)}
                                    />
                                  </TrS>
                                ))}
                              </TbodyS>
                            </TableS>
                          </div>
                        </>
                      ) : (
                        <TableCaptionS item={Transaction.Partnership} />
                      )}
                    </div>
                  )}
                </TabPanel>
                <TabPanel>
                  {isLoadingDetails ? <Loader /> : (
                    <AccountsTab
                      accounts={form.accounts}
                      handleViewAccountClick={handleViewAccountClick}
                      handleEditAccountClick={handleEditAccountClick}
                      handleAccountDelete={handleAccountDelete}
                    />
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </ModalBody>
        <ModalFooter style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          {mode === 'add' && <CancelButton onClick={onClose} />}
          {mode === 'edit' && (
            <DeleteTextButton
              transaction={Transaction.Partner}
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

      <PartnershipModal
        isOpen={isPartnershipModalOpen}
        onClose={() => setIsPartnershipModalOpen(false)}
        mode={partnershipMode}
        selectedPartnership={selectedPartnership}
        partnerId={selectedPartner?.id}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ['partner', selectedPartner.id],
          })
        }}
      />
      <AddAccount
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        mode={accountMode}
        selectedAccount={selectedAccount}
        partnerId={selectedPartner?.id}
        onSuccess={handleAccountSuccess}
      />
    </>
  )
}

const AccountsTab = ({
  accounts,
  handleViewAccountClick,
  handleEditAccountClick,
  handleAccountDelete,
}) => {
  if (!accounts || accounts.length === 0) {
    return <TableCaptionS item="Account" />
  }
  return (
    <div className="add_partner__details_card">
      <div className="add_partner__details_card-table_container">
        <TableS>
          <TheadS>
            <TrS>
              <ThS>Account Name</ThS>
              <ThS>Type</ThS>
              <ThS className="hide-on-mobile">Description</ThS>
              <ThMenuS />
            </TrS>
          </TheadS>
          <TbodyS>
            {accounts.map((acc, index) => (
              <TrS key={acc.id || index}>
                <TdS>{acc.name}</TdS>
                <TdS style={{ textTransform: 'capitalize' }}>{acc.type}</TdS>
                <TdS className="hide-on-mobile">{acc.description || 'N/A'}</TdS>
                <ThreeDotMenu
                  onView={() => handleViewAccountClick(acc)}
                  onEdit={() => handleEditAccountClick(acc)}
                  onDelete={() => handleAccountDelete(acc.id)}
                />
              </TrS>
            ))}
          </TbodyS>
        </TableS>
      </div>
    </div>
  )
}

const MainTab = ({
  disabled,
  handleChange,
  form,
  mode,
  handleAccountChange,
  addAccount,
  removeAccount,
  showAddAccounts,
  onShowAddAccountsChange,
  nameInputRef,
  phoneInputRef,
}) => {
  const handleSwitchToggle = (event) => {
    const isChecked = event.target.checked
    onShowAddAccountsChange(isChecked)
    if (isChecked && form.accounts.length === 0) {
      addAccount()
    }
  }

  return (
    <div className="add_partner_modal">
      <VStack>
        <InputField
          label="Partner Name"
          ref={nameInputRef}
          disabled={disabled}
          type="text"
          name="name"
          placeholder="Enter partner name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <PhoneNoField
        
          ref={phoneInputRef}
          disabled={disabled}
          label="Contact Phone"
          name="phone"
          placeholder="Enter contact phone"
          value={form.phone}
          onChange={handleChange}
          required
        />
        {/* --- COMPONENT SWAP --- */}
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
          disabled={disabled}
          label="Address"
          name="address"
          placeholder="Enter address"
          value={form.address}
          onChange={handleChange}
        />

        {mode === 'add' && (
          <div className="add_partner__accounts_section">
            <HStack
              justifyContent="flex-start"
              className="accounts_section__header"
            >
              <h3 className="accounts_section__title">Add Accounts</h3>
              <SwitchButton
                name="showAccounts"
                checked={showAddAccounts}
                onChange={handleSwitchToggle}
                disabled={disabled}
              />
            </HStack>

            {showAddAccounts && (
              <VStack>
                {form.accounts.map((account, index) => (
                  <div
                    key={index}
                    className="accounts_section__account_card fs14"
                  >
                    <HStack>
                      <input
                        className="accounts_section__account_card-names fs16"
                        disabled={disabled}
                        type="text"
                        name="name"
                        placeholder="Account Name"
                        value={account.name}
                        onChange={(e) => handleAccountChange(index, e)}
                        required
                      />
                      <Select
                        className="accounts_section__account_card-select fs16"
                        disabled={disabled}
                        name="type"
                        value={account.type}
                        onChange={(e) => handleAccountChange(index, e)}
                        required
                        options={accountTypes}
                      />
                    </HStack>
                    <input
                      className="accounts_section__account_card-description fs16 hide-on-mobile"
                      disabled={disabled}
                      name="description"
                      placeholder="Description"
                      value={account.description}
                      onChange={(e) => handleAccountChange(index, e)}
                    />
                    <button
                      type="button"
                      onClick={() => removeAccount(index)}
                      className="account_card__remove_btn"
                      disabled={disabled}
                      title="Remove Account"
                    >
                      &times;
                    </button>
                  </div>
                ))}

                <div className="add_account_button_wrapper">
                  <button
                    type="button"
                    onClick={addAccount}
                    className="add_partner__add_account_btn"
                    disabled={disabled}
                  >
                    +
                  </button>
                </div>
              </VStack>
            )}
          </div>
        )}
      </VStack>
    </div>
  )
}

export default AddPartner;