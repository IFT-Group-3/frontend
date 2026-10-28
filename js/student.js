/**
 * ROOMMATE - Shared helpers for the student pages
 * (hostels, hostel-details, room-selection, allocation-confirmation)
 * Depends on: app.js, api.js and auth.js
 */
(function () {
    const ALLOCATION_KEY = 'roommate-allocation';
    const REFERENCE_KEY = 'roommate-payment-reference';

    /** Build an element safely (text is never parsed as HTML). */
    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    function money(amount) {
        const value = Number(amount);
        return '₦' + (isNaN(value) ? '0' : value.toLocaleString('en-NG'));
    }

    function formatDate(value) {
        if (!value) return '';
        const date = new Date(String(value).replace(' ', 'T'));
        return isNaN(date) ? String(value) : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function param(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function saveJson(key, value) {
        try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
    }

    function loadJson(key) {
        try { return JSON.parse(sessionStorage.getItem(key)); } catch (e) { return null; }
    }

    function removeKey(key) {
        try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
    }

    /**
     * Call the API. If the server says we are not signed in, go to the login page.
     * Always returns { ok, status, data }.
     */
    async function call(path, body) {
        const result = body === undefined ? await Api.get(path) : await Api.post(path, body);
        if (result.status === 401) {
            Auth.clearUser();
            window.location.replace('../auth/login.html');
        }
        return result;
    }

    function showMessage(container, title, text, linkHref, linkText) {
        container.replaceChildren();
        const box = el('div', 'empty-state');
        box.appendChild(el('h3', '', title));
        if (text) box.appendChild(el('p', '', text));
        if (linkHref) {
            const link = el('a', 'btn btn-primary mt-4', linkText || 'Continue');
            link.href = linkHref;
            box.appendChild(link);
        }
        container.appendChild(box);
    }

    /** Load the shared layout pieces and icons. */
    function init() {
        document.addEventListener('DOMContentLoaded', () => {
            loadComponent('sidebar', 'sidebar-placeholder');
            loadComponent('navbar', 'navbar-placeholder');
            loadComponent('footer', 'footer-placeholder');
            loadComponent('modal', 'modal-placeholder');
            if (window.lucide) window.lucide.createIcons();
        });
    }

    window.Student = {
        ALLOCATION_KEY: ALLOCATION_KEY,
        REFERENCE_KEY: REFERENCE_KEY,
        el: el,
        money: money,
        formatDate: formatDate,
        param: param,
        saveJson: saveJson,
        loadJson: loadJson,
        removeKey: removeKey,
        call: call,
        showMessage: showMessage,
        init: init
    };
})();
