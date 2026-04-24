# MyIcecreamweb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Firebase Auth

The Angular app uses Firebase email/password authentication with this project config:

- `icecream-web-3c99c`
- `https://icecream-web-3c99c.firebaseapp.com`

If you want to run the login, registration, and password reset flows locally, make sure email/password sign-in is enabled in the Firebase console.

## Django Backend

The repository now includes a Django API in `backend/` that verifies Firebase ID tokens.

To run it locally:

```bash
cd backend
pip install -r requirements.txt
python manage.py check
python manage.py runserver 8000
```

Set these environment variables when you want the API to verify real Firebase tokens:

- `FIREBASE_PROJECT_ID=icecream-web-3c99c`
- `FIREBASE_CREDENTIALS_PATH=<path-to-service-account-json>`
- `CORS_ALLOWED_ORIGINS=http://localhost:4200`

Available API routes:

- `GET /api/health/`
- `GET /api/auth/me/` with `Authorization: Bearer <firebase-id-token>`
- `GET /api/menu/`
- `POST /api/menu/` (admin claim required)
- `PATCH /api/menu/:id/` (admin claim required)
- `DELETE /api/menu/:id/` (admin claim required)
- `GET /api/cart/` (authenticated)
- `PUT /api/cart/` (authenticated)
- `GET /api/orders/` (authenticated; returns all orders for admin)
- `POST /api/orders/` (authenticated)
- `PATCH /api/orders/:id/status/` (admin claim required)

Create the database tables once:

```bash
cd backend
python manage.py makemigrations api
python manage.py migrate
```

Set or remove Firebase admin custom claims for a user:

```bash
cd backend
python manage.py set_admin_claim <firebase-uid> --admin
python manage.py set_admin_claim <firebase-uid>
```

After changing custom claims, users should sign out and sign in again so new ID tokens include the updated claims.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## GitHub Pages Deploy

For this repository, deploy with the configured script:

```bash
npm run deploy
```

This uses the correct base href for the repo path (`/My-IceCreamWeb/`).

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
