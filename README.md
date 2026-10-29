# ROOMMATE frontend

ROOMMATE is the University of Ibadan hostel allocation web interface for IFT
302 Group 3. It is a dependency-light, static frontend built with HTML, CSS,
and browser JavaScript. Students can browse eligible hostels, select rooms,
create allocations, and continue to payment; administrators have separate
management screens for the operational data.

## Documentation map

| Document | Purpose |
| --- | --- |
| [`DOCUMENTATION.md`](./DOCUMENTATION.md) | Detailed UI behaviour, shared components, and authentication flows |
| [`openapi.yaml`](./openapi.yaml) | API contract used by the frontend and backend |
| [`credits.html`](./credits.html) | Project contributors and acknowledgements |

## Run locally

The component loader and browser `fetch` calls should be tested over HTTP,
not by opening an HTML file directly. From this directory, start a static
server with any of the following:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

The backend must be running separately. The frontend defaults to
`http://localhost/backend` when the page is opened on `localhost`, matching a
typical XAMPP installation. Set `window.ROOMMATE_API_BASE` before
`js/api.js` loads when the backend uses another path or host:

```html
<script>
  window.ROOMMATE_API_BASE = 'http://localhost/hostel-backend';
</script>
<script src="js/api.js"></script>
```

For a deployed frontend, the default API base is the current origin. Use the
override when the API is hosted on a different origin and configure the
backend's credentialed CORS allow-list accordingly.

## Features

- Student registration and session-based sign in.
- Hostel filtering based on student gender, including mixed hostels.
- Room and bed availability during the configured allocation period.
- Temporary bed holds while a Paystack payment is completed.
- Student allocation history and confirmation screens.
- Administrator dashboard for hostels, rooms, students, allocations, and payments.
- Shared responsive navigation, footer, modal, loader, and toast components.
- Light/dark theme persistence with a mobile navigation layout.
- Mock JSON data for administrator pages when the API is unavailable.

## Project structure

```text
components/       Reusable HTML fragments
css/              Global, component, authentication, student, and admin styles
js/               Shared utilities, API clients, auth, student, and admin logic
js/mock/          Fallback data used by administrator screens
pages/auth/       Student and administrator authentication pages
pages/student/    Student hostel, room, allocation, and dashboard pages
pages/admin/      Administrator dashboard and management pages
openapi.yaml      OpenAPI reference for the backend integration
DOCUMENTATION.md  Detailed frontend behaviour and implementation notes
```

## API and session behaviour

`js/api.js` sends JSON requests with `credentials: 'include'` so the
backend's PHP session cookie is retained. The API response, not the email
domain or the page used to sign in, determines whether the account is a
student or administrator. The backend remains responsible for authorization,
validation, payment verification, and all security decisions.

Password recovery and reset pages currently provide the interface and client
validation only; the API specification does not define recovery endpoints.
Do not treat their simulated success states as production password changes.

## Browser and deployment notes

- Serve the site over HTTP(S); `file://` previews cannot reliably load shared
  components or call the API.
- Keep the API base URL free of a trailing slash.
- Use HTTPS in production so session cookies and payment redirects are
  protected in transit.
- Do not put database credentials or Paystack secrets in this repository or
  in frontend JavaScript.
- The frontend is static and can be served by Apache, Nginx, GitHub Pages, or
  any equivalent static host.

## Contributing

Keep reusable markup in `components/`, shared behaviour in `js/app.js`, and
API calls in the API helpers rather than duplicating them in individual
pages. Update `DOCUMENTATION.md` and the OpenAPI examples when a user flow or
request contract changes. Before submitting a change, serve the site locally
and check the affected student and administrator pages at desktop and mobile
widths.
