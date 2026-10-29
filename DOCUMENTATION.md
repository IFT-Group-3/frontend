# ROOMMATE Frontend Documentation

This document describes the current frontend implementation. For first-time
setup, API configuration, and the repository map, start with
[`README.md`](./README.md).

## Contributor

**Femi-Akinwande Benjamin**  
**Student ID:** 250366

## Overview

ROOMMATE is a university hostel allocation frontend for the University of Ibadan. The frontend uses shared HTML components, global CSS variables, and a small JavaScript utility layer to keep navigation, feedback, themes, modals, and authentication pages consistent.

## Authentication Flow

### Sign in

File: `pages/auth/login.html`

1. The user enters an email and password.
2. The form submits to the shared authentication endpoint; the page does not assign a role based on email domain.
3. The password can be shown or hidden with the password toggle.
4. Invalid university email addresses display an inline warning and red input styling.
5. Valid submissions display a loading state on the **Sign in** button.
6. The API response determines the destination: `student` goes to `pages/student/dashboard.html`, while `admin` goes to `pages/admin/dashboard.html`.
7. The page includes links for forgotten passwords, admissions support, and License & Legal.

### Forgot password

File: `pages/auth/forgot-password.html`

1. The student enters a university email address.
2. The same `@stu.ui.edu.ng` restriction is applied.
3. Invalid addresses are blocked with inline validation feedback.
4. A loading state is shown while the recovery request is simulated.
5. A success toast is displayed.
6. The prototype redirects to `reset-password.html`.

### Reset password

File: `pages/auth/reset-password.html`

1. The student enters a new password with a minimum length of eight characters.
2. A strength indicator evaluates length, uppercase letters, numbers, and symbols.
3. The student confirms the new password.
4. Mismatched passwords are marked invalid and reported inline.
5. The reset button displays a loading state while the update is simulated.
6. A success toast is displayed before redirecting to the sign-in page.

### Validation note

Client-side validation improves the user experience but is not a security boundary. The backend must independently validate the email domain, password requirements, authentication credentials, reset token, and request state when the API is connected.

### Administrator sign in

Files: `pages/auth/admin-login.html`, `pages/admin/dashboard.html`

1. Administrators have a separate sign-in page for clear UI context, but it uses the same login endpoint as student sign-in.
2. The page submits the entered email and password without assigning or inferring a role.
3. The password has show/hide support and the submit button displays a loading state.
4. The form calls `POST https://hostel-system.iceiy.com/api/auth/login` with the documented `{ email, password }` payload.
5. The database-backed `user.role` determines routing: `admin` goes to the administration dashboard and `student` goes to the student dashboard.
6. The dashboard uses an administration-specific sidebar for students, hostels, rooms, allocations, and payments.
7. Current dashboard figures are display-only prototype content.

### API-backed sign in

Both sign-in pages use the documented login endpoint and send `credentials: 'include'` so the PHP `PHPSESSID` session cookie can be retained. The API response is the only source of the account role. Network failures, invalid JSON, unsuccessful responses, and missing roles are shown as inline form errors.

The API specification currently defines no password-recovery or password-reset endpoints. Those pages remain UI-only and are not sent to the backend.

The backend authenticates the account and determines its role from the database. It must establish a secure session and enforce permissions on protected routes. Administrative authentication should also support rate limiting, audit logging, secure password storage, and MFA where required.

### Administrator registration

The API provides two distinct administrator registration operations:

1. `POST /api/auth/bootstrap-admin` is a one-time, localhost-only setup operation used to create the first administrator from the terminal. It is not a public frontend registration flow and should be disabled or removed after initial setup.
2. `POST /api/auth/admin/register` is for an already authenticated administrator to create another administrator account. The backend enforces the existing administrator session and must reject unauthenticated or student requests.

The frontend does not expose either endpoint as a public registration form. Administrator creation remains controlled by the backend and an authenticated administrator session.

## Shared Components

Shared component files are stored in `components/`:

| Component | File | Purpose |
|---|---|---|
| Navbar | `navbar.html` | Shared branding, navigation links, theme toggle, login link, and mobile menu |
| Sidebar | `sidebar.html` | Student dashboard navigation |
| Admin sidebar | `admin-sidebar.html` | Administration dashboard navigation |
| Footer | `footer.html` | Shared landing-page, dashboard, and recovery-page footer |
| Modal | `modal.html` | Generic accessible modal structure |
| Loader | `loader.html` | Loading indicator markup |
| Toast | `toast.html` | Toast notification markup |

Components are loaded through `js/app.js`:

```js
loadComponent('navbar', 'navbar-placeholder');
loadComponent('footer', 'footer-placeholder');
loadComponent('modal', 'modal-placeholder');
```

Pages nested under `pages/` use the `../../` path prefix. Component links use the `{{prefix}}` placeholder, which is replaced at runtime with the correct relative path.

When a component cannot be fetched, the application keeps server-rendered markup or uses a JavaScript fallback for the navbar and footer. This allows the main navigation and footer to remain usable during local `file://` previews or unavailable component requests.

## Navigation and Responsive UI

- The navbar supports light and dark appearance modes.
- The selected theme is stored in `localStorage` under `theme-preference`.
- The theme control updates its tooltip and accessible label after switching modes.
- Theme-related colors transition over 250ms for a smoother mode change without animating layout.
- The saved or system-preferred theme is applied before stylesheets render to prevent a light/dark flash on page load.
- At viewport widths of 700px or less, navigation links collapse behind a menu button.
- The mobile menu exposes `aria-expanded` and changes its accessible label when opened or closed.
- The dashboard and landing page use the same navbar component and fallback behavior.

## Modal and Notification Utilities

### Modal

`openModal({ title, body, footer })` opens the generic modal and injects its content. `openLegalModal()` is a convenience wrapper that displays the project license. Modals can be closed by:

- Selecting the close button.
- Selecting the footer close button.
- Clicking the overlay outside the modal content.
- Pressing the `Escape` key.

### Toast

`showToast(message, type)` displays temporary success or error feedback. Toast messages are inserted as text rather than raw HTML, and each toast includes a dismiss button.

## Recent Changes

- Added shared navbar, footer, modal, loader, and toast component templates.
- Replaced hardcoded navbar and footer markup with reusable component loading.
- Added local fallbacks for navbar and footer rendering.
- Added generic modal support and repaired the License & Legal popup.
- Added light/dark theme persistence and responsive mobile navigation.
- Added university email suffix validation and styled inline validation warnings.
- Added password visibility controls and password strength feedback.
- Added loading states and success/error toast feedback to authentication forms.
- Removed the footer from the sign-in page as required; recovery and reset pages retain the shared footer.
- Added a separate administrator sign-in flow and administration dashboard shell.
- Added an administration sidebar component with links for operational management areas.
- Added an administrator sign-in call-to-action below the landing-page features section.
- Applied the saved or system theme before stylesheets render to prevent light/dark mode flash on page load.

## Relevant Files

- `js/app.js` — component loading, themes, validation helpers, modal, toast, and loading utilities.
- `css/global.css` — global reset, theme variables, typography, and base styles.
- `css/components.css` — navbar, footer, modal, form, card, and responsive component styles.
- `css/auth.css` — authentication layout and validation warning styles.
- `pages/auth/` — sign-in, forgot-password, and reset-password flows.
- `pages/student/dashboard.html` — student dashboard using shared navigation and footer.
- `pages/auth/admin-login.html` — separate administrator sign-in interface.
- `pages/admin/dashboard.html` — administration dashboard shell.
