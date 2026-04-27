import React, { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/Table";
// import Button from '@/components/Button';
import HStack from "@/components/HStack";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import PermissionSwitchButton from "@/components/PermissionSwitchButton";
import { Report } from "@/constants/object/report";
import Title from "@/components/Title";

import {
  PERMISSION_GROUPS,
  PERMISSION_ACTIONS,
  formatModuleName,
} from "@/constants/permissions";
import "./style.scss"; // This can now point to the modal-specific styles if needed

// Checkbox for the table header (can remain the same)
const HeaderCheckbox = ({ checked, onChange, indeterminate }) => (
  <input
    type="checkbox"
    ref={(el) => el && (el.indeterminate = indeterminate)}
    checked={checked}
    onChange={onChange}
  />
);

const ALL_MODULES = PERMISSION_GROUPS.flatMap((group) => group.modules);

const PermissionsModal = ({ isOpen, onClose, onSave, initialPermissions }) => {
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (isOpen) {
      setPermissions(JSON.parse(JSON.stringify(initialPermissions || {})));
    }
  }, [isOpen, initialPermissions]);

  const handleToggle = (module, action) => {
    setPermissions((prev) => {
      const newPermissions = JSON.parse(JSON.stringify(prev));
      if (!newPermissions[module]) {
        newPermissions[module] = {};
      }
      newPermissions[module][action] = !newPermissions[module][action];
      return newPermissions;
    });
  };

  const handleSelectAll = (action) => {
    setPermissions((prev) => {
      const newPermissions = JSON.parse(JSON.stringify(prev));
      const areAllChecked = ALL_MODULES.every(
        (module) => newPermissions[module]?.[action]
      );
      ALL_MODULES.forEach((module) => {
        if (!newPermissions[module]) {
          newPermissions[module] = {};
        }
        newPermissions[module][action] = !areAllChecked;
      });
      return newPermissions;
    });
  };

  const handleSave = () => {
    onSave(permissions);
    onClose();
  };

  const getHeaderCheckboxState = (action) => {
    const totalModules = ALL_MODULES.length;
    const checkedCount = ALL_MODULES.filter(
      (module) => permissions[module]?.[action]
    ).length;
    if (checkedCount === 0) return { checked: false, indeterminate: false };
    if (checkedCount === totalModules)
      return { checked: true, indeterminate: false };
    return { checked: false, indeterminate: true };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader>
        <Title report={Report.RolePermissions} />
      </ModalHeader>
      <ModalBody>
        <div className="permissions-table-container">
          <Table stickyHeader>
            <Thead>
              <Tr>
                <Th>Module</Th>
                {PERMISSION_ACTIONS.map((action) => {
                  const { checked, indeterminate } =
                    getHeaderCheckboxState(action);
                  return (
                    <Th key={action} className="permission-header">
                      {action.toUpperCase()}
                      <HeaderCheckbox
                        checked={checked}
                        indeterminate={indeterminate}
                        onChange={() => handleSelectAll(action)}
                      />
                    </Th>
                  );
                })}
              </Tr>
            </Thead>
            <Tbody>
              {PERMISSION_GROUPS.map((group) => (
                <React.Fragment key={group.title}>
                  <Tr className="group-header-row">
                    <Td colSpan={PERMISSION_ACTIONS.length + 1}>
                      {group.title}
                    </Td>
                  </Tr>
                  {group.modules.map((module) => (
                    <Tr key={module}>
                      <Td>{formatModuleName(module)}</Td>
                      {PERMISSION_ACTIONS.map((action) => (
                        <Td key={action} className="permission-cell">
                          <PermissionSwitchButton
                            name={`${module}-${action}`}
                            value={permissions[module]?.[action] || false}
                            onChange={() => handleToggle(module, action)}
                            variant={action.toLowerCase()}
                          />
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </React.Fragment>
              ))}
            </Tbody>
          </Table>
        </div>
      </ModalBody>
      <ModalFooter>
        <HStack>
          <CancelButton variant="secondary" onClick={onClose} />
          {/* Cancel */}
          {/* </CancelButton> */}
          <SubmitButton onClick={handleSave} />
        </HStack>
      </ModalFooter>
    </Modal>
  );
};

export default PermissionsModal;
