import React from 'react'
import Pagination from 'react-paginating'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'
import { RxDoubleArrowLeft, RxDoubleArrowRight } from 'react-icons/rx'
import { useIsMobile } from '@/utils/useIsMobile'

import './style.scss'

const PageSelect = ({
  totalItems,
  itemsPerPage,
  currentPage,
  viewAll,
  handlePageChange,
}) => {
  const isMobile = useIsMobile()
  const pageCount = isMobile ? 3 : 5

  if (totalItems <= 0 || viewAll) return null

  const getFormattedNumber = (value) => {
    return value < 10 ? `0${value}` : `${value}`
  }

  return (
    <Pagination
      total={totalItems}
      limit={itemsPerPage}
      pageCount={pageCount}
      currentPage={currentPage}
    >
      {({
        pages,
        hasNextPage,
        hasPreviousPage,
        previousPage,
        nextPage,
        totalPages,
        getPageItemProps,
      }) => (
        <div className="pagination">
          {/* First Page */}
          <button
            {...getPageItemProps({
              pageValue: 1,
              onPageChange: handlePageChange,
            })}
            title="First"
            className="pagination__left_button"
            disabled={!hasPreviousPage}
          >
            <RxDoubleArrowLeft size={isMobile ? 30 : 22} color="var(--navy)" />
          </button>

          {hasPreviousPage && (
            <button
              {...getPageItemProps({
                pageValue: previousPage,
                onPageChange: handlePageChange,
              })}
              className="pagination__left_button"
              title="Previous"
            >
              <MdKeyboardArrowLeft
                size={isMobile ? 30 : 24}
                color="var(--navy)"
              />
            </button>
          )}

          {/* Pages */}
          <div className="pagination__pages">
            {pages.map((page) => {
              const isActive = currentPage === page

              const pageClassName = `pagination__num fs14 fw500 ${
                isActive ? 'pagination__num--is-active fw600 ' : ''
              }`

              return (
                <button
                  key={page}
                  {...getPageItemProps({
                    pageValue: page,
                    onPageChange: handlePageChange,
                  })}
                  className={pageClassName}
                >
                  {getFormattedNumber(page)}
                </button>
              )
            })}
          </div>

          {hasNextPage && (
            <button
              {...getPageItemProps({
                pageValue: nextPage,
                onPageChange: handlePageChange,
              })}
              title="Next"
              className="pagination__left_button"
            >
              <MdKeyboardArrowRight
                size={isMobile ? 30 : 24}
                color="var(--navy)"
              />
            </button>
          )}

          {/* Last Page */}
          <button
            {...getPageItemProps({
              pageValue: totalPages,
              onPageChange: handlePageChange,
            })}
            title="Last"
            className="pagination__left_button"
            disabled={!hasNextPage}
          >
            <RxDoubleArrowRight size={isMobile ? 30 : 22} color="var(--navy)" />
          </button>
        </div>
      )}
    </Pagination>
  )
}

export default PageSelect
