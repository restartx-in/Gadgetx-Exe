import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import Title from "@/components/Title";
import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import PhoneNoField from "@/components/PhoneNoField";
import Select from "@/components/Select";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import Loader from "@/components/Loader";
import SwitchButton from "@/apps/user/components/SwitchButton";
import {
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
} from "@/apps/user/components/Tabs";
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
} from "@/components/TableS";
import ThreeDotMenu from "@/apps/user/components/ThreeDotMenu";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import { Report } from "@/constants/object/report";
import { onFormError } from "@/utils/formUtils";

const DRAFT_PREFIX = "partner_form_draft_";

const partnerSchema = z.object({
  name: z.string().min(1, "Partner name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional().nullable(),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
  accounts: z
    .array(
      z.object({
        name: z.string().min(1, "Account name is required"),
        type: z.enum(["cash", "bank"]),
        description: z.string().optional().nullable(),
      }),
    )
    .optional(),
});

const CommonAddPartner = ({
  isOpen,
  onClose,
  mode,
  selectedPartner,
  onSuccess,
  // Hooks
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  usePartnerByIdHook,
  usePartnershipHook,
  useDeletePartnershipHook,
  useDeleteAccountHook,
  // Components
  DoneByComponent,
  CostCenterComponent,
  PartnershipModal,
  AddAccountModal,
  appTag = "common",
}) => {
  const showToast = useToast();
  const queryClient = useQueryClient();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_PREFIX}${appTag}`;
  const partnerId = mode !== "add" ? selectedPartner?.id : null;

  // Track if a submission just succeeded to prevent draft saving
  const isSubmittingSuccess = useRef(false);

  const [tabIndex, setTabIndex] = useState(0);
  const [showAddAccounts, setShowAddAccounts] = useState(false);
  const [subModal, setSubModal] = useState({
    type: null,
    mode: "add",
    item: null,
  });

  const { data: partnerDetails, isLoading: isLoadingDetails } =
    usePartnerByIdHook(partnerId);
  const { data: partnershipData, isLoading: isLoadingPartnerships } =
    usePartnershipHook({ partner_id: partnerId, enabled: !!partnerId });

  const { mutateAsync: createPartner, isPending: creating } = useCreateHook();
  const { mutateAsync: updatePartner, isPending: updating } = useUpdateHook();
  const { mutateAsync: deletePartner, isPending: deleting } = useDeleteHook();
  const { mutateAsync: deletePartnership } = useDeletePartnershipHook();
  const { mutateAsync: deleteAccount } = useDeleteAccountHook();

  const defaultValues = {
    name: "",
    phone: "",
    address: "",
    done_by_id: null,
    cost_center_id: null,
    accounts: [],
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(partnerSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "accounts",
  });
  const watchedFields = watch();

  useEffect(() => {
    if (isOpen) {
      isSubmittingSuccess.current = false; // Reset lock when modal opens
      if (mode === "edit" || mode === "view") {
        const initialData = partnerDetails || selectedPartner || defaultValues;
        reset({ ...defaultValues, ...initialData });
        setTabIndex(0);
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        if (selectedPartner?.name) {
          reset({ ...defaultValues, name: selectedPartner.name });
        } else if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setShowAddAccounts(parsed.showAddAccounts || false);
          reset(parsed.formData);
        } else {
          reset(defaultValues);
          setShowAddAccounts(false);
        }
      }
      if (mode !== "view") setTimeout(() => setFocus("name"), 100);
    }
  }, [
    isOpen,
    mode,
    selectedPartner,
    partnerDetails,
    reset,
    setFocus,
    draftKey,
  ]);

  // Draft Persistence Logic (Blocked if submission just succeeded)
  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ formData: watchedFields, showAddAccounts }),
      );
    }
  }, [watchedFields, showAddAccounts, mode, isOpen, draftKey]);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      done_by_id: data.done_by_id ? Number(data.done_by_id) : null,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
      addAccount: mode === "add" && showAddAccounts,
    };

    try {
      if (mode === "edit") {
        await updatePartner({ id: selectedPartner.id, data: payload });
        showToast({
          crudItem: CRUDITEM.PARTNER,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        isSubmittingSuccess.current = true; // Block draft saving
        localStorage.removeItem(draftKey); // Clear storage immediately

        await createPartner(payload);

        reset(defaultValues); // Wipe form state
        setShowAddAccounts(false); // Reset local toggle state

        showToast({
          crudItem: CRUDITEM.PARTNER,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Error saving",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          <Title report={Report.Partner} mode={mode} />
        </ModalHeader>
        <ModalBody>
          {mode === "add" ? (
            <PartnerMainFields
              control={control}
              disabled={disabled}
              mode={mode}
              fields={fields}
              append={append}
              remove={remove}
              showAddAccounts={showAddAccounts}
              setShowAddAccounts={setShowAddAccounts}
              DoneByComponent={DoneByComponent}
              CostCenterComponent={CostCenterComponent}
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
                  <PartnerMainFields
                    control={control}
                    disabled={disabled}
                    mode={mode}
                    DoneByComponent={DoneByComponent}
                    CostCenterComponent={CostCenterComponent}
                  />
                </TabPanel>
                <TabPanel>
                  {isLoadingPartnerships ? (
                    <Loader />
                  ) : (
                    <PartnershipTable
                      data={partnershipData}
                      onView={(p) =>
                        setSubModal({
                          type: "partnership",
                          mode: "view",
                          item: p,
                        })
                      }
                      onEdit={(p) =>
                        setSubModal({
                          type: "partnership",
                          mode: "edit",
                          item: p,
                        })
                      }
                      onDelete={async (id) => {
                        await deletePartnership(id);
                        queryClient.invalidateQueries({
                          queryKey: ["partner", partnerId],
                        });
                      }}
                    />
                  )}
                </TabPanel>
                <TabPanel>
                  {isLoadingDetails ? (
                    <Loader />
                  ) : (
                    <AccountsTable
                      data={watchedFields.accounts}
                      onView={(a) =>
                        setSubModal({ type: "account", mode: "view", item: a })
                      }
                      onEdit={(a) =>
                        setSubModal({ type: "account", mode: "edit", item: a })
                      }
                      onDelete={async (id) => {
                        await deleteAccount(id);
                        queryClient.invalidateQueries({
                          queryKey: ["partner", partnerId],
                        });
                      }}
                    />
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </ModalBody>
        <ModalFooter
          style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}
        >
          {mode === "add" && <CancelButton onClick={onClose} />}
          {mode === "edit" && (
            <DeleteTextButton
              transaction={Transaction.Partner}
              onDelete={() => deletePartner(selectedPartner.id).then(onClose)}
              isLoading={deleting}
            />
          )}
          {mode !== "view" && (
            <SubmitButton
              isLoading={creating || updating}
              disabled={disabled}
              type={mode}
              onClick={handleSubmit(onFormSubmit, (e) =>
                onFormError(e, showToast),
              )}
            />
          )}
        </ModalFooter>
      </Modal>

      <PartnershipModal
        isOpen={subModal.type === "partnership"}
        onClose={() => setSubModal({ type: null })}
        mode={subModal.mode}
        selectedPartnership={subModal.item}
        partnerId={partnerId}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["partner", partnerId] })
        }
      />
      <AddAccountModal
        isOpen={subModal.type === "account"}
        onClose={() => setSubModal({ type: null })}
        mode={subModal.mode}
        selectedAccount={subModal.item}
        partnerId={partnerId}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["partner", partnerId] })
        }
      />
    </>
  );
};

// --- Structural Sub-Components ---

const PartnerMainFields = ({
  control,
  disabled,
  mode,
  fields,
  append,
  remove,
  showAddAccounts,
  setShowAddAccounts,
  DoneByComponent,
  CostCenterComponent,
}) => (
  <VStack>
    <Controller
      name="name"
      control={control}
      render={({ field }) => (
        <InputField
          {...field}
          label="Partner Name"
          disabled={disabled}
          required
        />
      )}
    />
    <Controller
      name="phone"
      control={control}
      render={({ field }) => (
        <PhoneNoField
          {...field}
          label="Contact Phone"
          disabled={disabled}
          required
        />
      )}
    />
    <Controller
      name="done_by_id"
      control={control}
      render={({ field }) => <DoneByComponent {...field} disabled={disabled} />}
    />
    <Controller
      name="cost_center_id"
      control={control}
      render={({ field }) => (
        <CostCenterComponent {...field} disabled={disabled} />
      )}
    />
    <Controller
      name="address"
      control={control}
      render={({ field }) => (
        <TextArea {...field} label="Address" disabled={disabled} />
      )}
    />

    {mode === "add" && (
      <div className="add_partner__accounts_section">
        <HStack justifyContent="flex-start">
          <h3 className="fs16fw600">Add Accounts</h3>
          <SwitchButton
            checked={showAddAccounts}
            onChange={(e) => {
              setShowAddAccounts(e.target.checked);
              if (e.target.checked && fields.length === 0)
                append({ name: "", type: "cash", description: "" });
            }}
            disabled={disabled}
          />
        </HStack>
        {showAddAccounts && (
          <VStack>
            {fields.map((item, index) => (
              <div key={item.id} className="accounts_section__account_card">
                <HStack>
                  <Controller
                    name={`accounts.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        placeholder="Account Name"
                        disabled={disabled}
                      />
                    )}
                  />
                  <Controller
                    name={`accounts.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={[
                          { value: "cash", label: "Cash" },
                          { value: "bank", label: "Bank" },
                        ]}
                        disabled={disabled}
                      />
                    )}
                  />
                </HStack>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={disabled}
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add_account_btn"
              onClick={() =>
                append({ name: "", type: "cash", description: "" })
              }
              disabled={disabled}
            >
              +
            </button>
          </VStack>
        )}
      </div>
    )}
  </VStack>
);

const PartnershipTable = ({ data, onView, onEdit, onDelete }) =>
  !data?.length ? (
    <TableCaptionS item={Transaction.Partnership} />
  ) : (
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
        {data.map((p) => (
          <TrS key={p.id}>
            <TdDateS>{p.created_at}</TdDateS>
            <TdNumericS>{p.contribution}</TdNumericS>
            <TdNumericS>{p.profit_share}</TdNumericS>
            <ThreeDotMenu
              onView={() => onView(p)}
              onEdit={() => onEdit(p)}
              onDelete={() => onDelete(p.id)}
            />
          </TrS>
        ))}
      </TbodyS>
    </TableS>
  );

const AccountsTable = ({ data, onView, onEdit, onDelete }) =>
  !data?.length ? (
    <TableCaptionS item="Account" />
  ) : (
    <TableS>
      <TheadS>
        <TrS>
          <ThS>Account Name</ThS>
          <ThS>Type</ThS>
          <ThMenuS />
        </TrS>
      </TheadS>
      <TbodyS>
        {data.map((acc) => (
          <TrS key={acc.id}>
            <TdS>{acc.name}</TdS>
            <TdS style={{ textTransform: "capitalize" }}>{acc.type}</TdS>
            <ThreeDotMenu
              onView={() => onView(acc)}
              onEdit={() => onEdit(acc)}
              onDelete={() => onDelete(acc.id)}
            />
          </TrS>
        ))}
      </TbodyS>
    </TableS>
  );

export default CommonAddPartner;
