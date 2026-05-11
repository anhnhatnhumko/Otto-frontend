import { useState, useMemo, useEffect } from "react";

export const usePagination = <T,>(items: T[], pageSize: number = 10) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 when filtered items shrink below current page
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    pageSize,
  };
};
