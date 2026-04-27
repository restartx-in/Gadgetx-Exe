import { useState } from "react";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSL,
  TdSL,
  TdMenu,
  ThMenu,
  TableCaption,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import HStack from "@/components/HStack";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem";
import Spacer from "@/components/Spacer";
import TitleContainer from "@/components/TitleContainer";
import TableTopContainer2 from "@/components/TableTopContainer2";
import useDeleteTenant from "@/apps/user/hooks/api/tenant/useDeleteTenant";
import useTenants from "@/apps/user/hooks/api/tenant/useTenants";
import "./style.scss";
import AddTenant from "./components/AddTenant";
import { HiInboxStack } from "react-icons/hi2";
const TenantList = () => {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const { data: tenants, isLoading } = useTenants(); // Replaced useCostCenters, costCenters -> tenants
  const { mutateAsync: deleteTenant } = useDeleteTenant(); // Replaced useDeleteCostCenter

  // Modal State Re-added and Renamed
  const [selectedTenant, setSelectedTenant] = useState(null); // Replaced selectedCostCenter
  const [mode, setMode] = useState("view");
  const [isOpenTenantModal, setIsOpenTenantModal] = useState(false); // Replaced isOpenCostCenterModal

  const handleAddClick = () => {
    setMode("add");
    setSelectedTenant(null); // Replaced setSelectedCostCenter
    setIsOpenTenantModal(true); // Replaced setIsOpenCostCenterModal
  };

  const handleEditClick = (tenant) => {
    // Updated parameter name
    setSelectedTenant(tenant); // Replaced setSelectedCostCenter
    setMode("edit");
    setIsOpenTenantModal(true); // Replaced setIsOpenCostCenterModal
  };

  const handleViewClick = (tenant) => {
    // Updated parameter name
    setSelectedTenant(tenant); // Replaced setSelectedCostCenter
    setMode("view");
    setIsOpenTenantModal(true); // Replaced setIsOpenCostCenterModal
  };

  const handleDelete = async (id) => {
    try {
      await deleteTenant(id); // Replaced deleteCostCenter
      showToast({
        crudItem: CRUDITEM.Tenant, // Replaced CRUDITEM.CostCenter
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.Tenant, // Replaced CRUDITEM.CostCenter
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  };

  // Calculate number of columns for TableCaption: SL + Name + Type + Plan + Menu = 5
  const tableColCount = 5;

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <TableTopContainer2>
              <PageTitleWithBackButton title="Tenants" />

              <>
                <HStack>
                  <AddButton onClick={handleAddClick}>
                    Add Tenant {/* Replaced Add Cost Center */}
                  </AddButton>
                </HStack>
              </>
            </TableTopContainer2>
            {isLoading ? (
              <Loader />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th>Name</Th>
                    <Th>Type</Th> {/* NEW COLUMN */}
                    <Th>Plan</Th> {/* NEW COLUMN */}
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {tenants && tenants.length > 0 ? (
                    tenants.map((tenant, index) => (
                      <Tr key={tenant.id}>
                        <TdSL index={index} page={1} pageSize={10} />
                        <Td>{tenant.name}</Td>
                        <Td>{tenant.type}</Td> {/* RENDER NEW COLUMN */}
                        <Td>{tenant.plan}</Td> {/* RENDER NEW COLUMN */}
                        <TdMenu
                          onEdit={() => handleEditClick(tenant)}
                          onView={() => handleViewClick(tenant)}
                          onDelete={() => handleDelete(tenant.id)}
                        />
                      </Tr>
                    ))
                  ) : (
                    <TableCaption
                      item={Transaction.Tenant} // Replaced Transaction.CostCenter
                      noOfCol={tableColCount}
                    />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <TitleContainer>
              <PageTitleWithBackButton title="Tenants" />{" "}
              {/* Replaced Cost Centers */}
            </TitleContainer>
            <ScrollContainer>
              <PageHeader>
                <div className="tenant-add_button">
                  {" "}
                  {/* Replaced cost_center-add_button */}
                  <AddButton onClick={handleAddClick}>
                    Add Tenant {/* Replaced Add Cost Center */}
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : tenants && tenants.length === 0 ? (
                <TableCaption item={Transaction.Tenant} />
              ) : (
                <div className="mobile-list-view tenant-mobile-list">
                  {" "}
                  {/* Replaced cost_center-mobile-list */}
                  {tenants && // Replaced costCenters
                    tenants.map(
                      (
                        tenant // Replaced type/costCenter with tenant
                      ) => (
                        <ListItem
                          key={tenant.id}
                          title={tenant.name}
                          onView={() => handleViewClick(tenant)}
                          onEdit={() => handleEditClick(tenant)}
                          onDelete={() => handleDelete(tenant.id)}
                        />
                      )
                    )}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddTenant
        isOpen={isOpenTenantModal} // Replaced isOpenCostCenterModal
        onClose={() => setIsOpenTenantModal(false)} // Replaced setIsOpenCostCenterModal
        mode={mode}
        selectedTenant={selectedTenant} // Replaced selectedCostCenter
      />
    </>
  );
};

export default TenantList;
