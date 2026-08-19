export function unwrapPagedRows(result) {
    const payload = result?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

export function unwrapLastPage(result) {
    return result?.data?.last_page
        || result?.pagination?.last_page
        || result?.pagination?.total_pages
        || 1;
}

export function prependRow(list, row) {
    if (!row?.id) return Array.isArray(list) ? list : [];
    const current = Array.isArray(list) ? list : [];
    return [{ ...row, _justCreated: true }, ...current.filter((item) => item.id !== row.id)];
}

export function authGetHeaders(token) {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    };
}
