import React, { useMemo } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { RxDoubleArrowLeft, RxDoubleArrowRight } from "react-icons/rx";
import { useIsMobile } from "@/utils/useIsMobile";

import "./style.scss";

const PageSelect = ({
  totalItems,
  itemsPerPage,
  currentPage,
  viewAll,
  handlePageChange,
}) => {
  const isMobile = useIsMobile();
  const pageCount = isMobile ? 3 : 5;

  const { totalPages, pages, hasNextPage, hasPreviousPage } = useMemo(() => {
    const tp = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const half = Math.floor(pageCount / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(tp, start + pageCount - 1);
    start = Math.max(1, end - pageCount + 1);
    const p = [];
    for (let i = start; i <= end; i++) p.push(i);
    return {
      totalPages: tp,
      pages: p,
      hasNextPage: currentPage < tp,
      hasPreviousPage: currentPage > 1,
    };
  }, [totalItems, itemsPerPage, currentPage, pageCount]);

  if (totalItems <= 0 || viewAll) return null;

  const getFormattedNumber = (value) => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  return (
    <div className="pagination">
      {/* First Page */}
      <button
        onClick={() => handlePageChange(1)}
        title="First"
        className="pagination__left_button"
        disabled={!hasPreviousPage}
      >
        <RxDoubleArrowLeft size={isMobile ? 30 : 22} color="var(--navy)" />
      </button>

      {hasPreviousPage && (
        <button
          onClick={() => handlePageChange(currentPage - 1)}
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
          const isActive = currentPage === page;

          const pageClassName = `pagination__num fs14 fw500 ${
            isActive ? "pagination__num--is-active fw600 " : ""
          }`;

          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={pageClassName}
            >
              {getFormattedNumber(page)}
            </button>
          );
        })}
      </div>

      {hasNextPage && (
        <button
          onClick={() => handlePageChange(currentPage + 1)}
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
        onClick={() => handlePageChange(totalPages)}
        title="Last"
        className="pagination__left_button"
        disabled={!hasNextPage}
      >
        <RxDoubleArrowRight size={isMobile ? 30 : 22} color="var(--navy)" />
      </button>
    </div>
  );
};

export default PageSelect;
