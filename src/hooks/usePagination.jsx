import { useMemo } from "react";

export default function usePagination({ currentPage, totalPages, setCurrentPage, maxVisiblePages = 5 }) {
    const paginationItems = useMemo(() => {
        const items = [];

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First Page
        if (startPage > 1) {
            items.push(
                <li key={1} className={`page-item ${currentPage === 1 ? "active" : ""}`}>
                    <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}>
                        1
                    </a>
                </li>
            );

            if (startPage > 2) {
                items.push(
                    <li key="start-ellipsis" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
        }

        // Middle Pages
        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
                    <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}>
                        {i}
                    </a>
                </li>
            );
        }

        // Last Page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(
                    <li key="end-ellipsis" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }

            items.push(
                <li key={totalPages} className={`page-item ${currentPage === totalPages ? "active" : ""}`}>
                    <a href="#" className="page-link" onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }}>
                        {totalPages}
                    </a>
                </li>
            );
        }

        return items;
    }, [currentPage, totalPages, setCurrentPage, maxVisiblePages]);

    return paginationItems;
}
