import React from 'react';

export default function TablePagination({
    currentPage = 1,
    totalItems = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100],
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    if (totalItems === 0) {
        return null;
    }

    const from = (safeCurrentPage - 1) * pageSize + 1;
    const to = Math.min(safeCurrentPage * pageSize, totalItems);

    // Hitung tombol halaman yang akan ditampilkan (smart sliding window)
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, safeCurrentPage - 2);
            let end = Math.min(totalPages, safeCurrentPage + 2);

            if (safeCurrentPage <= 3) {
                start = 1;
                end = maxVisible;
            } else if (safeCurrentPage >= totalPages - 2) {
                start = totalPages - maxVisible + 1;
                end = totalPages;
            }

            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50/70 border-t border-gray-100 text-xs text-gray-600">
            {/* Informasi Rentang Data */}
            <div className="flex items-center gap-3">
                <span>
                    Menampilkan <strong className="text-gray-900 font-semibold">{from}</strong> -{' '}
                    <strong className="text-gray-900 font-semibold">{to}</strong> dari{' '}
                    <strong className="text-gray-900 font-semibold">{totalItems}</strong> data
                </span>

                {onPageSizeChange && (
                    <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 pl-3">
                        <span className="text-gray-500">Baris:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                onPageSizeChange(Number(e.target.value));
                                if (onPageChange) onPageChange(1);
                            }}
                            className="text-xs py-1 px-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-emerald-500 bg-white shadow-xs font-medium cursor-pointer"
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt} / hal
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Tombol Navigasi Halaman */}
            <div className="flex items-center space-x-1">
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={safeCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Halaman Pertama"
                >
                    «
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Sebelumnya"
                >
                    ‹
                </button>

                {getPageNumbers().map((p, idx) => {
                    if (p === '...') {
                        return (
                            <span key={`dots-${idx}`} className="px-2 py-1 text-gray-400">
                                ...
                            </span>
                        );
                    }

                    const isActive = p === safeCurrentPage;
                    return (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={`min-w-[32px] h-8 px-2 rounded-lg font-semibold transition ${
                                isActive
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {p}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => onPageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Selanjutnya"
                >
                    ›
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Halaman Terakhir"
                >
                    »
                </button>
            </div>
        </div>
    );
}
