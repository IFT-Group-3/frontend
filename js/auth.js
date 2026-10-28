/**
 * ROOMMATE - Auth helpers (shared by the login and welcome pages)
 *
 * Backend contract (POST /api/auth/login) - JSON in, JSON out:
 *   Request  POST { "email": "...", "password": "..." }
 *   Success  200  { "success": true,  "message": "Login successful",
 *                   "user": { "id": 1, "name": "Ada Obi", "email": "...",
 *                             "role": "student", "matric_no": "123456" } }
 *   Failure  401  { "success": false, "message": "Incorrect email or password." }
 *
 * api/auth/logout.php: POST, destroys the PHP session, returns { "success": true }.
 *
 * Needs js/api.js loaded first. Set USE_MOCK = true to test without a backend.
 */
(function () {
    const CONFIG = {
        USE_MOCK: false,
        MOCK_PASSWORD: 'password123',
        LOGIN_PATH: '/api/auth/login',
        LOGOUT_PATH: '/api/auth/logout',
        WELCOME_PAGE: '../../welcome.html',
        ADMIN_PAGE: '../admin/dashboard.html',
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
            const result = await Api.post(CONFIG.LOGIN_PATH, { email: email, password: password });
            const data = result.data;

            if (!result.ok || !data.success) {
                return { success: false, message: data.message || 'Login failed. Please try again.' };
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
                await Api.post(CONFIG.LOGOUT_PATH);
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
