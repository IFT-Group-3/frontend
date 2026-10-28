/**
 * ROOMMATE - Shared API helper
 * One place that knows where the backend lives and how to call it.
 *
 * - On localhost the backend is expected at http://localhost/backend (XAMPP).
 * - When hosted, the API is on the same site (location.origin).
 * - To point somewhere else, set window.ROOMMATE_API_BASE before this file loads.
 */
(function () {
    const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
    const BASE = (window.ROOMMATE_API_BASE || (isLocal ? 'http://localhost/backend' : location.origin)).replace(/\/+$/, '');

    function url(path) {
        return BASE + '/' + String(path).replace(/^\/+/, '');
    }

    /**
     * Calls the API and always returns { ok, status, data }.
     * Network failures return ok:false with a friendly message instead of throwing.
     */
    async function request(path, options = {}) {
        const init = {
            method: options.method || 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        };
        if (options.body !== undefined) {
            init.headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url(path), init);
            let data = null;
            try { data = await response.json(); } catch (e) { /* not JSON */ }
            return { ok: response.ok && !!data && data.success !== false, status: response.status, data: data || {} };
        } catch (error) {
            console.error(error);
            return {
                ok: false,
                status: 0,
                data: { success: false, message: 'Could not reach the server. Check your connection and try again.' }
            };
        }
    }

    window.Api = {
        base: BASE,
        url: url,
        request: request,
        get: (path) => request(path),
        post: (path, body) => request(path, { method: 'POST', body: body || {} })
    };
})();
