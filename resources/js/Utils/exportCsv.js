/**
 * Helper untuk mengunduh array of objects menjadi file CSV secara instan di browser.
 * Menyertakan UTF-8 BOM (\uFEFF) agar terbaca sempurna di Microsoft Excel.
 */
export function exportToCsv(filename, columns, data) {
    if (!data || !data.length) {
        alert('Tidak ada data yang dapat diekspor.');
        return;
    }

    const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

    const rows = data.map(item => {
        return columns.map(c => {
            const val = typeof c.value === 'function' ? c.value(item) : item[c.key];
            const cleanVal = val === null || val === undefined ? '' : String(val);
            return `"${cleanVal.replace(/"/g, '""')}"`;
        }).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
