/**
 * ROOMMATE - Global Application Logic
 */

const LICENSE_FALLBACK = `MIT License

Copyright (c) 2026 IFT Group 3

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
const API_BASE_URL = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost/hostel-backend' : location.hostname.endsWith('iceiy.com') ? location.origin : 'https://hostel-system.iceiy.com';

const COMPONENT_FALLBACKS = {
    navbar: '<header class="main-header"><nav class="nav-container" aria-label="Main navigation"><a href="{{prefix}}index.html" class="main-logo">ROOMMATE</a><button class="nav-menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" onclick="toggleMobileNav()"><i data-lucide="menu" aria-hidden="true"></i></button><div class="nav-links" id="main-navigation"><a href="{{prefix}}index.html#features">Features</a><a href="{{prefix}}index.html#about">About</a><button class="btn-icon theme-toggle" type="button" onclick="toggleDarkMode()" aria-label="Switch to dark mode"><i data-lucide="sun" class="sun-icon"></i><i data-lucide="moon" class="moon-icon"></i></button><a href="{{prefix}}pages/auth/login.html" class="btn btn-secondary">Login</a></div></nav></header>',
    footer: '<footer class="main-footer"><div class="container"><div class="footer-grid"><div class="footer-col"><a href="{{prefix}}index.html" class="main-logo">ROOMMATE</a><p class="text-sm text-muted-foreground">Official hostel allocation portal for the University of Ibadan. Making student life easier, one room at a time.</p></div><div class="footer-col"><h4>Student</h4><ul class="footer-links"><li><a href="{{prefix}}pages/auth/login.html">Login</a></li><li><a href="{{prefix}}index.html#features">How it works</a></li></ul></div><div class="footer-col"><h4>Support</h4><ul class="footer-links"><li><a href="mailto:it-support@ui.edu.ng">IT Services</a></li><li><a href="mailto:hostels@ui.edu.ng">Contact Us</a></li></ul></div><div class="footer-col"><h4>Legal</h4><ul class="footer-links"><li><a href="javascript:void(0)" onclick="openLegalModal()">License &amp; Legal</a></li></ul></div></div><div class="footer-bottom"><p>&copy; 2026 University of Ibadan. All rights reserved.</p><a href="{{prefix}}credits.html">Meet the team!</a></div></div></footer>'
};

/**
 * Component Loader
 */
async function loadComponent(componentName, targetId, callback) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const prefix = window.location.pathname.includes('/pages/') ? '../../' : '';
    const componentUrl = `${prefix}components/${componentName}.html`;

    try {
        const response = await fetch(componentUrl);
        if (!response.ok) throw new Error(`Unable to load ${componentName} component`);
        const template = await response.text();
        targetElement.innerHTML = template.replace(/\{\{prefix\}\}/g, prefix);
        finishLoading(callback);
    } catch (error) {
        console.error(error);
        if (!targetElement.innerHTML.trim() && COMPONENT_FALLBACKS[componentName]) {
            targetElement.innerHTML = COMPONENT_FALLBACKS[componentName].replace(/\{\{prefix\}\}/g, prefix);
        }
        finishLoading(callback);
    }
}

function finishLoading(callback) {
    // 1. Initialize icons
    if (window.lucide) window.lucide.createIcons();
    updateThemeToggle();

    // 2. Handle Auto-Active links
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-item, .nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('../../', '').replace('../', ''))) {
            link.classList.add('active');
        }
    });

    if (callback) callback();
}

/**
 * UI Utilities
 */
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast animate-in`;
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    
    toast.innerHTML = `
        <i data-lucide="${icon}" aria-hidden="true"></i>
        <span class="toast-message"></span>
        <button class="toast-close" type="button" aria-label="Dismiss notification">&times;</button>
    `;
    toast.querySelector('.toast-message').textContent = message;

    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setBtnLoading(btnElement, isLoading) {
    if (isLoading) btnElement.classList.add('btn-loading');
    else btnElement.classList.remove('btn-loading');
}

function isUniversityEmail(value) {
    return /^[^\s@]+@stu\.ui\.edu\.ng$/i.test(value.trim());
}

function isStaffEmail(value) {
    return /^[^\s@]+@ui\.edu\.ng$/i.test(value.trim()) && !/@stu\.ui\.edu\.ng$/i.test(value.trim());
}

function validateStaffEmail(input, messageElement) {
    const valid = isStaffEmail(input.value);
    input.classList.toggle('is-invalid', !valid);
    input.classList.toggle('is-valid', valid);
    input.setCustomValidity(valid ? '' : 'Use an authorized university staff email ending in @ui.edu.ng.');
    if (messageElement) {
        messageElement.textContent = valid ? '' : 'Use an authorized university staff email ending in @ui.edu.ng.';
        messageElement.hidden = valid;
    }

    return valid;
}

async function signIn(email, password) {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password })
        });
    } catch (error) {
        throw new Error('Unable to connect to the authentication service. Try again.');
    }

    let payload;
    try {
        payload = await response.json();
    } catch (error) {
        throw new Error('The authentication service returned an invalid response.');
    }

    if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Invalid email or password.');
    }
    if (!payload.user || !['student', 'admin'].includes(payload.user.role)) {
        throw new Error('The authentication response did not include a valid account role.');
    }
    return payload.user;
}

function validateUniversityEmail(input, messageElement) {
    const valid = isUniversityEmail(input.value);
    input.classList.toggle('is-invalid', !valid);
    input.classList.toggle('is-valid', valid);
    input.setCustomValidity(valid ? '' : 'Use your university email ending in @stu.ui.edu.ng.');
    if (messageElement) {
        messageElement.textContent = valid ? '' : 'Use your university email ending in @stu.ui.edu.ng.';
        messageElement.hidden = valid;
    }
    return valid;
}

/**
 * Theme & Modals
 */
function toggleDarkMode() {
    const html = document.documentElement;
    const newMode = html.getAttribute('data-appearance') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-appearance', newMode);
    localStorage.setItem('theme-preference', newMode);
    updateThemeToggle(newMode);
}

function updateThemeToggle(mode = document.documentElement.getAttribute('data-appearance') || 'light') {
    document.querySelectorAll('.theme-toggle').forEach(button => {
        const darkMode = mode === 'dark';
        const label = darkMode ? 'Switch to light mode' : 'Switch to dark mode';
        button.title = label;
        button.setAttribute('aria-label', label);
    });
}

function toggleMobileNav() {
    const toggle = document.querySelector('.nav-menu-toggle');
    const navigation = document.getElementById('main-navigation');
    if (!toggle || !navigation) return;
    const isOpen = navigation.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
}

async function openModal({ title, body, footer } = {}) {
    const placeholder = document.getElementById('modal-placeholder');
    if (!placeholder) return;
    if (!document.getElementById('generic-modal')) await loadComponent('modal', 'modal-placeholder');

    let modal = document.getElementById('generic-modal');
    if (!modal) {
        placeholder.innerHTML = `
            <div id="generic-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title"></h3>
                        <button class="btn-close" type="button" aria-label="Close dialog" onclick="closeModal('generic-modal')">&times;</button>
                    </div>
                    <div class="modal-body" id="modal-body"></div>
                    <div class="modal-footer" id="modal-footer"></div>
                </div>
            </div>`;
        modal = document.getElementById('generic-modal');
    }
    if (!modal) return;
    modal.querySelector('#modal-title').textContent = title || '';
    modal.querySelector('#modal-body').replaceChildren(body instanceof Node ? body : document.createTextNode(body || ''));
    modal.querySelector('#modal-footer').innerHTML = footer || '<button class="btn btn-secondary" type="button" onclick="closeModal(\'generic-modal\')">Close</button>';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const firstAction = modal.querySelector('.btn-close, .modal-footer button');
    if (firstAction) firstAction.focus();
}

async function openLegalModal() {
    const body = document.createElement('pre');
    body.id = 'license-text';
    body.textContent = 'Loading license...';
    await openModal({ title: 'License & Legal', body });

    const nestedPage = window.location.pathname.includes('/pages/');
    const licenseUrl = nestedPage ? '../../../LICENSE' : '../LICENSE';
    try {
        const response = await fetch(licenseUrl);
        if (!response.ok) throw new Error(`Unable to load license file (${response.status})`);
        body.textContent = await response.text();
    } catch (error) {
        console.error(error);
        body.textContent = LICENSE_FALLBACK;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
}

document.addEventListener('click', event => {
    const modal = event.target.closest('.modal-overlay');
    if (modal && event.target === modal) closeModal(modal.id);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay.active');
        if (modal) closeModal(modal.id);
    }
});

// Initialization
(function() {
    const savedMode = localStorage.getItem('theme-preference');
    if (savedMode) document.documentElement.setAttribute('data-appearance', savedMode);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-appearance', 'dark');
    updateThemeToggle();
})();

window.loadComponent = loadComponent;
window.openModal = openModal;
window.openLegalModal = openLegalModal;
window.closeModal = closeModal;
window.toggleDarkMode = toggleDarkMode;
window.toggleMobileNav = toggleMobileNav;
window.showToast = showToast;
window.setBtnLoading = setBtnLoading;
window.isUniversityEmail = isUniversityEmail;
window.isStaffEmail = isStaffEmail;
window.validateStaffEmail = validateStaffEmail;
window.validateUniversityEmail = validateUniversityEmail;
window.signIn = signIn;
