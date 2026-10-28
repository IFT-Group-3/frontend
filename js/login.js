/**
 * ROOMMATE - Student login page logic
 * Depends on: app.js (toast, validators, loadComponent) and auth.js
 */
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();
    loadComponent('navbar', 'navbar-placeholder');

    // Already signed in? Skip the form.
    if (Auth.getUser()) {
        window.location.replace(Auth.config.WELCOME_PAGE);
        return;
    }

    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const formAlert = document.getElementById('form-alert');
    const formAlertText = document.getElementById('form-alert-text');
    const loginBtn = document.getElementById('login-btn');
    const togglePass = document.getElementById('toggle-password');

    let submitted = false;

    function showFormError(message) {
        formAlertText.textContent = message;
        formAlert.hidden = false;
    }

    function clearFormError() {
        formAlert.hidden = true;
        formAlertText.textContent = '';
    }

    function validatePassword() {
        const valid = passwordInput.value.length > 0;
        passwordInput.classList.toggle('is-invalid', !valid);
        passwordError.textContent = valid ? '' : 'Enter your password.';
        passwordError.hidden = valid;
        return valid;
    }

    // Live validation once the student has tried to submit or left the field
    emailInput.addEventListener('blur', () => {
        if (emailInput.value.trim()) validateUniversityEmail(emailInput, emailError);
    });
    emailInput.addEventListener('input', () => {
        clearFormError();
        if (submitted) validateUniversityEmail(emailInput, emailError);
    });
    passwordInput.addEventListener('input', () => {
        clearFormError();
        if (submitted) validatePassword();
    });

    // Show / hide password
    togglePass.addEventListener('click', () => {
        const show = passwordInput.type === 'password';
        passwordInput.type = show ? 'text' : 'password';
        togglePass.classList.toggle('is-visible', show);
        togglePass.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        togglePass.setAttribute('aria-pressed', String(show));
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        submitted = true;
        clearFormError();

        const emailOk = validateUniversityEmail(emailInput, emailError);
        const passwordOk = validatePassword();
        if (!emailOk) { emailInput.focus(); return; }
        if (!passwordOk) { passwordInput.focus(); return; }

        setBtnLoading(loginBtn, true);
        loginBtn.disabled = true;

        const result = await Auth.login(emailInput.value.trim(), passwordInput.value);

        if (result.success) {
            Auth.saveUser(result.user);
            showToast('Welcome back! Redirecting...');
            setTimeout(() => window.location.assign(Auth.config.WELCOME_PAGE), 700);
            return; // keep the button in its loading state while redirecting
        }

        setBtnLoading(loginBtn, false);
        loginBtn.disabled = false;
        showFormError(result.message);
        showToast(result.message, 'error');
        passwordInput.select();
    });
});
