import React from 'react';
import './Pagination.css';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const Pagination = ({ page, size, total, pages, onPageChange, onSizeChange }) => {
  if (pages <= 1 && total <= PAGE_SIZE_OPTIONS[0]) return null;

  const getPageNumbers = () => {
    const nums = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(pages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      nums.push(1);
      if (start > 2) nums.push('...');
    }
    for (let i = start; i <= end; i++) {
      nums.push(i);
    }
    if (end < pages) {
      if (end < pages - 1) nums.push('...');
      nums.push(pages);
    }
    return nums;
  };

  return (
    <div className="pagination">
      <div className="pagination-left">
        <select
          className="page-size-select"
          value={size}
          onChange={(e) => onSizeChange && onSizeChange(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s} 条/页</option>
          ))}
        </select>
      </div>

      <div className="pagination-center">
        <button
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          上一页
        </button>

        {getPageNumbers().map((num, idx) =>
          num === '...' ? (
            <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={num}
              className={`page-btn page-num-btn${num === page ? ' active' : ''}`}
              onClick={() => onPageChange(num)}
            >
              {num}
            </button>
          )
        )}

        <button
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
        >
          下一页
        </button>
      </div>

      <div className="pagination-right">
        <span className="page-info">
          第 {page}/{pages} 页（共 {total} 条）
        </span>
      </div>
    </div>
  );
};

export default Pagination;
