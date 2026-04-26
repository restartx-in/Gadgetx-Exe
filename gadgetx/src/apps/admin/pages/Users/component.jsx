import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import useUsers from '@/hooks/api/user/useUsers'
import useDeleteUser from '@/hooks/api/user/useDeleteUser'
import { useIsMobile } from '@/utils/useIsMobile'
import PageHeader from '@/components/PageHeader'
import PageTitleWithBackButton from '@/components/PageTitleWithBackButton'
import PopupFilter from '@/components/PopUpFilter'
import RefreshButton from '@/components/RefreshButton'
import SearchField from '@/components/SearchField'
import AddButton from '@/components/AddButton'
import Select from '@/components/Select'
import MobileSearchField from '@/components/MobileSearchField'
import CommonSkeleton from '@/components/CommonSkeleton'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TdSL,
  ThSL,
  TdMenu,
  ThMenu,
} from '@/components/Table'
import TableFooter from '@/components/TableFooter'
import TableWrapper from '@/components/TableWrapper'
import Spacer from '@/components/Spacer'

import ContainerWrapper from '@/components/ContainerWrapper'
import VStack from '@/components/VStack'
import HStack from '@/components/HStack'
import ListItem from '@/apps/user/components/ListItem/component'
import ScrollContainer from '@/components/ScrollContainer'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import './style.scss'

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'Standard User' },
]

const searchOptions = [{ value: 'username', name: 'Username' }]

const Users = () => {
  const showToast = useToast()

  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const searchRef = useRef(null)

  const [showFilter, setShowFilter] = useState(false)
  const [listData, setListData] = useState([])
  const [role, setRole] = useState('')
  const [searchKey, setSearchKey] = useState('')

  const [state, setState] = useState({
    page: 1,
    page_size: 10,
    user_type: '',
    username: '',
  })

  const { data, isLoading, isError, error, refetch } = useUsers(state)

  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    if (data) {
      setListData(data.data || [])
      setTotalItems(data.count || 0)
      setTotalPages(data.page_count || 1)
    }
  }, [data])

  const handleFilter = () => {
    setState({
      ...state,
      page: 1,
      user_type: role,
      username: searchKey,
    })
    setShowFilter(false)
  }

  const handleSearch = () => {
    setState({
      ...state,
      page: 1,
      username: searchKey,
    })
  }

  const handleRefresh = () => {
    setRole('')
    setSearchKey('')
    if (searchRef.current) searchRef.current.value = ''

    setState({
      page: 1,
      page_size: 10,
      user_type: '',
      username: '',
    })
  }

  const handlePageLimitSelect = (value) => {
    setState({ ...state, page_size: value, page: 1 })
  }

  const handlePageChange = (value) => {
    setState({ ...state, page: value })
  }

  const handleAddClick = () => navigate('/admin/users/add')
  const handleEditClick = (id) => navigate(`/admin/users/edit/${id}`)

  const handleViewClick = (id) => {
    navigate(`/admin/users/edit/${id}`, { state: { viewMode: true } })
  }

  const { mutateAsync: deleteUser } = useDeleteUser()

  const handleDelete = async (id) => {
    try {
      await deleteUser(id)
      showToast({
        crudItem: CRUDITEM.USER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      })
      refetch()
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || 'Failed to delete the expense.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  if (isLoading && !data) return <CommonSkeleton />
  if (isError) return <p>Error fetching users: {error.message}</p>

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Users" />
            <PageHeader>
              <HStack
                justifyContent="flex-start"
                className="vehicle_report-actions"
              >
                <PopupFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={handleFilter}
                >
                  <VStack>
                    <Select
                      label="Role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      options={roleOptions}
                    />
                  </VStack>
                </PopupFilter>
                <RefreshButton onClick={handleRefresh} />
                <SearchField
                  searchKey={searchKey}
                  setSearchKey={setSearchKey}
                  searchType={'username'}
                  setSearchType={() => {}}
                  handleSearch={handleSearch}
                  searchOptions={searchOptions}
                  searchRef={searchRef}
                />
                <AddButton onClick={handleAddClick}>Add User</AddButton>
              </HStack>
            </PageHeader>
          {listData.length === 0 ? (
            <div className="users_list-no_data_message">No users found.</div>
          ) : (
            <Table className="users_list__table_container-table">
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Username</Th>
                  <Th>Role</Th>
                  <Th>Joined On</Th>
                  <ThMenu />
                </Tr>
              </Thead>
              <Tbody>
                {listData.map((user, index) => (
                  <Tr key={user.id}>
                    <TdSL
                      index={index}
                      page={state.page}
                      pageSize={state.page_size}
                    />
                    <Td>{user.username}</Td>
                    <Td>
                      {user.user_type === 'admin'
                        ? 'Administrator'
                        : 'Standard User'}
                    </Td>
                    <Td>
                      {new Date(user.created_at).toLocaleDateString('en-IN')}
                    </Td>
                    <TdMenu
                      onEdit={() => handleEditClick(user.id)}
                      onView={() => handleViewClick(user.id)}
                      onDelete={() => handleDelete(user.id)}
                    />
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}

          {!isLoading && listData.length > 0 && (
            <TableFooter
              totalItems={totalItems}
              currentPage={state.page}
              itemsPerPage={state.page_size}
              totalPages={totalPages}
              handlePageLimitSelect={handlePageLimitSelect}
              handlePageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <>
          <PageTitleWithBackButton title="Users" />
          <ScrollContainer>
            {/* <HStack> */}
            <PageHeader>
              <HStack>
                <PopupFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={handleFilter}
                >
                  <VStack>
                    <Select
                      label="Role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      options={roleOptions}
                    />
                  </VStack>
                </PopupFilter>

                <RefreshButton onClick={handleRefresh} />
                <MobileSearchField
                  searchKey={searchKey}
                  setSearchKey={setSearchKey}
                  searchType={'username'}
                  setSearchType={() => {}}
                  handleSearch={handleSearch}
                  searchOptions={searchOptions}
                  searchRef={searchRef}
                />
              </HStack>
              <div className="users_list-add_button">
                <AddButton onClick={handleAddClick}>Add User</AddButton>
              </div>
            </PageHeader>
            {/* </HStack> */}

            <div className="users_list">
              {listData.length === 0 ? (
                <div className="users_list-no_data_message">
                  No users found.
                </div>
              ) : (
                <VStack>
                  {listData.map((user) => (
                    <ListItem
                      key={user.id}
                      title={user.username}
                      subtitle={
                        <>
                          <div>
                            Role:{' '}
                            <span style={{ textTransform: 'capitalize' }}>
                              {user.user_type === 'admin'
                                ? 'Administrator'
                                : 'Standard User'}
                            </span>
                          </div>
                          <div>
                            Joined:{' '}
                            {new Date(user.created_at).toLocaleDateString(
                              'en-IN',
                            )}
                          </div>
                        </>
                      }
                      onView={() => handleViewClick(user.id)}
                      onEdit={() => handleEditClick(user.id)}
                      onDelete={() => handleDelete(user.id)}
                    />
                  ))}
                </VStack>
              )}
            </div>
            <Spacer />
            {!isLoading && listData.length > 0 && (
              <TableFooter
                totalItems={totalItems}
                currentPage={state.page}
                itemsPerPage={state.page_size}
                totalPages={totalPages}
                handlePageLimitSelect={handlePageLimitSelect}
                handlePageChange={handlePageChange}
              />
            )}
          </ScrollContainer>
        </>
      )}
    </ContainerWrapper>
  )
}

export default Users
