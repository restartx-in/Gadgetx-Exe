import PageLimitSelect from '@/components/PageLimitSelect'
import PageSelect from '@/components/PageSelect'
import './style.scss'
import { useIsMobile } from '@/utils/useIsMobile'

const TableFooter = ({
  handlePageLimitSelect,
  totalItems,
  currentPage,
  handlePageChange,
  itemsPerPage,
  viewAll = false,
}) => {
  const isMobile = useIsMobile()

  return (
    <div className={`table_footer ${isMobile ? 'pt20 pb20' : 'pt10'}`}>
      {handlePageLimitSelect && itemsPerPage && (
        <PageLimitSelect
          handlePageLimitSelect={handlePageLimitSelect}
          viewAll={viewAll}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          currentPage={currentPage}
        />
      )}

      <PageSelect
        totalItems={totalItems}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        handlePageChange={handlePageChange}
        viewAll={viewAll}
      />
    </div>
  )
}

export default TableFooter
