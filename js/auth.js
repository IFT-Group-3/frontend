/**
 * ROOMMATE - Auth helpers (shared by the login and welcome pages)
 *
 * Backend contract (api/auth/login.php) - JSON in, JSON out:
 *   Request  POST { "email": "...", "password": "..." }
 *   Success  200  { "success": true,  "message": "Login successful",
 *                   "user": { "id": 1, "name": "Ada Obi", "email": "...",
 *                             "role": "student", "matric_no": "123456" } }
 *   Failure  401  { "success": false, "message": "Incorrect email or password." }
 *
 * api/auth/logout.php: POST, destroys the PHP session, returns { "success": true }.
 *
 * While the PHP endpoints are not ready, USE_MOCK = true lets the frontend be
 * tested on its own. Set it to false once the backend is in.
 */
(function () {
    const CONFIG = {
        USE_MOCK: true,
        MOCK_PASSWORD: 'password123',
        LOGIN_URL: '../../api/auth/login.php',
        LOGOUT_URL: '../../api/auth/logout.php',
        WELCOME_PAGE: '../../welcome.html',
        LOGIN_PAGE: 'pages/auth/login.html',
        STORAGE_KEY: 'roommate-user'
    };

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    /* ---- Session helpers (display info only; real auth is the PHP session) ---- */
    function saveUser(user) {
        try { sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(user)); } catch (e) { /* storage blocked */ }
    }

    function getUser() {
        try {
            const raw = sessionStorage.getItem(CONFIG.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function clearUser() {
        try { sessionStorage.removeItem(CONFIG.STORAGE_KEY); } catch (e) { /* ignore */ }
    }

    function nameFromEmail(email) {
        const local = String(email).split('@')[0].replace(/[0-9]+/g, '');
        const words = local.split(/[._-]+/).filter(Boolean);
        if (!words.length) return 'Student';
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    /* ---- Login ---- */
    async function mockLogin(email, password) {
        await wait(700);
        if (!window.isUniversityEmail(email)) {
            return { success: false, message: 'Use your university email ending in @stu.ui.edu.ng.' };
        }
        if (password !== CONFIG.MOCK_PASSWORD) {
            return { success: false, message: 'Incorrect email or password.' };
        }
        return {
            success: true,
            message: 'Login successful',
            user: { id: 1, name: nameFromEmail(email), email: email, role: 'student' }
        };
    }

    async function login(email, password) {
        if (CONFIG.USE_MOCK) return mockLogin(email, password);

        try {
            const response = await fetch(CONFIG.LOGIN_URL, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            let data = null;
            try { data = await response.json(); } catch (e) { /* non-JSON response */ }

            if (!response.ok || !data || !data.success) {
                return { success: false, message: (data && data.message) || 'Login failed. Please try again.' };
            }
            if (!data.user) data.user = { name: nameFromEmail(email), email: email, role: 'student' };
            return data;
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Could not reach the server. Check your connection and try again.' };
        }
    }

    /* ---- Logout ---- */
    async function logout() {
        if (!CONFIG.USE_MOCK) {
            try {
                await fetch(CONFIG.LOGOUT_URL, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
                });
            } catch (error) {
                console.error(error);
            }
        } else {
            await wait(300);
        }
        clearUser();
    }

    window.Auth = {
        config: CONFIG,
        login: login,
        logout: logout,
        saveUser: saveUser,
        getUser: getUser,
        clearUser: clearUser,
        nameFromEmail: nameFromEmail
    };
})();
