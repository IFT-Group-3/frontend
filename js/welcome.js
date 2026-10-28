/**
 * ROOMMATE - Student welcome page logic
 * Depends on: app.js (toast, setBtnLoading) and auth.js
 */
document.addEventListener('DOMContentLoaded', () => {
    // Guard: no signed-in user -> back to login.
    // (Cosmetic only. The PHP session must protect the real pages and APIs.)
    const user = Auth.getUser();
    if (!user) {
        window.location.replace(Auth.config.LOGIN_PAGE);
        return;
    }

    const name = (user.name && user.name.trim()) || Auth.nameFromEmail(user.email || '');
    const firstName = name.split(/\s+/)[0];
    const initials = name.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || 'S';

    function greeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    setText('greeting', `${greeting()}, ${firstName}`);
    setText('user-initials', initials);
    setText('hero-initials', initials);
    setText('header-name', name);
    setText('user-email', user.email || '');
    setText('user-role', user.role === 'admin' ? 'Hostel administrator' : 'Student');

    const matricChip = document.getElementById('matric-chip');
    if (matricChip && user.matric_no) {
        setText('user-matric', user.matric_no);
        matricChip.hidden = false;
    }

    if (window.lucide) window.lucide.createIcons();

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async () => {
        setBtnLoading(logoutBtn, true);
        logoutBtn.disabled = true;
        await Auth.logout();
        showToast('You have been signed out.');
        setTimeout(() => window.location.assign(Auth.config.LOGIN_PAGE), 500);
    });
});
