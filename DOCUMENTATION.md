# ROOMMATE Frontend Documentation

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

Files: `pages/auth/admin-login.html`, `js/app.js` (`signIn`), `pages/admin/dashboard.html`

1. Administrators have a separate sign-in page for clear UI context, but it uses the same login endpoint as student sign-in.
2. The page submits the entered email and password without assigning or inferring a role.
3. The password has show/hide support and the submit button displays a loading state.
4. The form calls `POST /api/auth/login` with the documented `{ email, password }` payload. The API host is resolved from the page's hostname (see [API base URL](#api-base-url)).
5. On success the returned user object is saved in `sessionStorage` under `hostel_admin`, and the database-backed `user.role` determines routing: `admin` goes to the administration dashboard and `student` goes to the student dashboard.
6. The administration pages are described in [Administration Portal](#administration-portal).

### API-backed sign in

Both sign-in pages use the documented login endpoint and send `credentials: 'include'` so the PHP `PHPSESSID` session cookie can be retained. The API response is the only source of the account role. Network failures, invalid JSON, unsuccessful responses, and missing roles are shown as inline form errors.

The API specification currently defines no password-recovery or password-reset endpoints. Those pages remain UI-only and are not sent to the backend.

The backend authenticates the account and determines its role from the database. It must establish a secure session and enforce permissions on protected routes. Administrative authentication should also support rate limiting, audit logging, secure password storage, and MFA where required.

### API base URL

`js/app.js` (`API_BASE_URL`) and `js/admin.js` (`ADMIN.API_BASE`) resolve the backend root the same way:

| Page served from | Backend root |
|---|---|
| `localhost` or `127.0.0.1`, path contains `/ift-project/` | `http://localhost/ift-project/backend` |
| `localhost` or `127.0.0.1`, any other path | `http://localhost/backend` |
| Any other host | `location.origin` (the frontend and API are served from the same origin) |

Endpoint paths such as `/api/auth/login` are appended to this root. The two constants are duplicated, so a change to the backend location must be made in both files.

### Administrator registration

The API provides two distinct administrator registration operations:

1. `POST /api/auth/bootstrap-admin` is a one-time, localhost-only setup operation used to create the first administrator from the terminal. It is not a public frontend registration flow and should be disabled or removed after initial setup.
2. `POST /api/auth/admin/register` is for an already authenticated administrator to create another administrator account. The backend enforces the existing administrator session and must reject unauthenticated or student requests.

The frontend does not expose either endpoint as a public registration form. Administrator creation remains controlled by the backend and an authenticated administrator session.

## Administration Portal

### Structure

| Part | File | Role |
|---|---|---|
| Admin kit | `js/admin.js` | Exposes everything on one global, `AdminKit`: API client, session guard, page shell, table/pager/KPI renderers, badges, toast, CSV export |
| Admin styles | `css/admin.css` | All `a-` prefixed styles used by the five management pages |
| Mock data | `js/mock/admin/*.json` | Sample responses, used only when `ADMIN.USE_MOCK` is `true` |
| Overview | `pages/admin/dashboard.html` | Summary tiles |
| Management pages | `pages/admin/{hostels,rooms,students,allocations,payments}.html` | Searchable, filterable, paginated lists |

The overview and the management pages do not share a shell:

- `dashboard.html` loads `css/global.css`, `css/components.css`, `js/app.js`, and the shared navbar, footer, and `components/admin-sidebar.html`.
- The five management pages load only `css/global.css`, `css/admin.css`, and `js/admin.js`. `AdminKit.mountAdminShell()` wraps `<main id="content">` with its own sidebar (a drawer on mobile) and top bar containing search, a notifications button, and a theme toggle. The sidebar links come from `ADMIN_NAV` in `js/admin.js`, not from `components/admin-sidebar.html`.

### Access guard and session

- `AdminKit.adminSession.require()` runs first on every admin page. If `sessionStorage` has no `hostel_admin` entry, the browser is redirected to `pages/auth/admin-login.html`.
- The guard only checks that the entry exists. It does not check `role`, and `admin-login.html` stores the user object for students as well. It is a convenience, not access control: the backend must reject non-admin sessions on `/api/admin/*`, and the API documents `401` and `403` for this.
- The log-out button in the top bar clears `hostel_admin` and returns to the sign-in page. It does not call `POST /api/auth/logout`, so the PHP session stays valid until it expires. The **Sign out** link in `components/admin-sidebar.html` (dashboard only) navigates to the sign-in page without clearing `hostel_admin`.

### Data loading

All admin pages read from one endpoint, `GET /api/admin/dashboard`, sent with `credentials: 'include'`.

- `adminApi.students()`, `hostels()`, `rooms()`, `allocations()`, and `payments()` each fetch the full dashboard response and use the matching array (`students`, `hostels`, and so on).
- `adminApi.roomBeds(roomId)` fetches the dashboard again and filters its `beds` array by `room_id`.
- The `page` and `per_page` query parameters are never sent, so the API's defaults apply (page 1, 50 rows per collection). Pages paginate those rows in the browser, and records beyond the first 50 in a collection are not reachable. The students page footer reports the true total from `pagination.totals`.
- Search and filters run in the browser on the loaded rows.
- Every request has an 8-second timeout. A network failure, or a non-JSON error response, shows "Could not reach the server. Try again."; a JSON error body shows the API's own `message`. Failed loads render an error state with a **Try again** button.
- All server values are escaped (`esc()`) before being inserted into HTML, and missing values show as an em dash.

### Pages

| Page | Rows per page | Search | Filters | Other |
|---|---|---|---|---|
| Overview | n/a | n/a | n/a | Tiles: **Pending applications** (`summary.active_reservations`), **Available rooms** (rooms with `available_beds` above 0), **Confirmed allocations** (`summary.confirmed_allocations`) |
| Hostels | 6 | all listed columns | Type, status | Table shows raw schema columns |
| Rooms & Beds | 10 | room fields; also filters the beds table | Hostel, block, availability | Selecting a room opens a side panel with its beds (Occupied, Reserved, Available) from `current_status` |
| Students | 5 | name, matric number, email | Department, level, allocation status | Side panel with allocation and invoice status, cross-referenced from `allocations` and `payments` by `user_id` and `allocation_id` |
| Allocations | 5 | all listed columns | Session (start and end date), status | KPI tiles for confirmed, pending, cancelled, and expired |
| Payments | 5 | reference, student name, email | Status | KPI tiles for collected (sum of `Paid` `amount_ngn`), pending, and failed; **Export CSV** |

**Export CSV** (payments) downloads `payments.csv` containing the rows that match the current search and filter. Cells starting with `=`, `+`, `-`, or `@` are prefixed with a quote so spreadsheet applications do not run them as formulas.

On narrow screens the lists switch from tables to stacked cards, and the sidebar becomes a drawer closed with the close button, the scrim, or `Escape`.

### Not yet connected

These controls are visible but only show a "not connected yet" toast or do nothing:

- **+ Add Hostel** (Hostels), **Edit Room** (Rooms), and **View full profile** (Students).
- **Reports** and **Settings** in the management-page sidebar (they link to `#`) and the notifications button.

The API also defines `POST /api/admin/hostels`, `POST /api/admin/rooms`, and `PUT /api/admin/allocation-period`. The frontend does not call them yet. The Rooms page's **Reserved** availability filter currently matches nothing, because room status is derived as only `available` or `full`.

### Mock mode

Set `ADMIN.USE_MOCK` to `true` in `js/admin.js` to serve the JSON files in `js/mock/admin/` with a short artificial delay and a fake login. Adding `?mock=NETWORK` to a page URL then simulates a network failure. `USE_MOCK` is `false` in the committed code, so all pages use the live API.

## Shared Components

Shared component files are stored in `components/`:

| Component | File | Purpose |
|---|---|---|
| Navbar | `navbar.html` | Shared branding, navigation links, theme toggle, login link, and mobile menu |
| Sidebar | `sidebar.html` | Student dashboard navigation |
| Admin sidebar | `admin-sidebar.html` | Administration overview navigation (the management pages use the sidebar built by `js/admin.js`) |
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
- Added the administration pages for hostels, rooms and beds, students, allocations, and payments, backed by `GET /api/admin/dashboard`.
- Added `js/admin.js` (`AdminKit`) and `css/admin.css` for the administration shell, tables, filters, pagination, and payments CSV export.
- Replaced the fixed API host with hostname-based resolution and hardened error handling for non-JSON and error responses.
- Updated file paths after the `Frontend/` folder was moved to the repository root.

## Relevant Files

- `js/app.js` — component loading, themes, validation helpers, modal, toast, and loading utilities.
- `css/global.css` — global reset, theme variables, typography, and base styles.
- `css/components.css` — navbar, footer, modal, form, card, and responsive component styles.
- `css/auth.css` — authentication layout and validation warning styles.
- `pages/auth/` — sign-in, forgot-password, and reset-password flows.
- `pages/student/dashboard.html` — student dashboard using shared navigation and footer.
- `pages/auth/admin-login.html` — separate administrator sign-in interface.
- `pages/admin/dashboard.html` — administration overview using shared navigation and the admin sidebar component.
- `pages/admin/hostels.html`, `rooms.html`, `students.html`, `allocations.html`, `payments.html` — administration management pages.
- `js/admin.js` — `AdminKit`: admin API client, access guard, page shell, list rendering helpers, and CSV export.
- `css/admin.css` — styles for the administration management pages.
- `js/mock/admin/` — sample API responses used when `ADMIN.USE_MOCK` is enabled.
- `openapi.yaml` — backend API specification.
