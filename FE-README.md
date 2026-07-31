# Car Catalogue

Front end assessment. A React and TypeScript application that queries a mocked GraphQL API
with Apollo Client and presents the results as a filterable catalogue of cars built with
Material UI.

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. MSW intercepts the requests to `/graphql`, so no
backend is needed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Serve the production build |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run lint` | Run ESLint |

## How the requirements are covered

| Task | Where |
| --- | --- |
| Apollo Client querying `GetCars` | `hooks/useCars.ts` |
| A different image per screen size | `hooks/useCarImageSize.ts`, `components/CarCard.tsx` |
| Material UI cards | `components/CarCard.tsx`, `theme.ts` |
| Form that adds a car to local state | `components/AddCarDialog.tsx`, `hooks/useCars.ts` |
| Mocked API call for the creation | `mocks/handlers.ts` (`AddCar` mutation) |
| Search and sorting | `hooks/useCarFilters.ts`, `components/CarToolbar.tsx` |
| GraphQL logic inside `useCars()` | `hooks/useCars.ts` |
| Unit tests | `src/__tests__/` |

Optional extras, all implemented:

| Extra | Where |
| --- | --- |
| Second query by make, model, year or color | `GET_CAR` in `graphql/queries.ts`, `useCar()` |
| Year filter, combined with the search | `hooks/useCarFilters.ts` |
| Reusable `useCarFilters()` hook | `hooks/useCarFilters.ts` |

## Missing dependencies in the starter

The starter did not include everything Material UI and the testing task need. Added:

- `@emotion/react` and `@emotion/styled`, peer dependencies of MUI 7 without which no
  component renders
- `@mui/icons-material`, pinned to `7.1.1` so it matches the MUI version already in the
  project
- `vitest`, `jsdom` and Testing Library for the unit tests. `cypress` was present but it
  is an end to end runner, and it was listed under `dependencies` instead of
  `devDependencies`

There was also no ESLint configuration, so `npm run lint` failed out of the box. A flat
config was added using the plugins the project already depended on.

## Structure

```text
src/
├── __tests__/        unit tests
├── components/       presentation
├── graphql/          queries, mutation and the shared fragment
├── hooks/            data access and view state
├── mocks/            MSW handlers and the car list
├── test/             test setup and helpers
├── types/            domain types
├── utils/            pure helpers
├── theme.ts          Material UI theme
├── App.tsx           providers and screen composition
└── main.tsx          entry point, starts MSW
```

Components receive data through props and never talk to Apollo directly. Every GraphQL
concern lives in `hooks/useCars.ts`, and every filtering concern in
`hooks/useCarFilters.ts`, which keeps both testable in isolation.

## Testing

```bash
npm test
```

69 tests across 7 files.

## Notes

Created cars live in the Apollo cache and, when the MSW worker is reachable, are created
through the mocked `AddCar` mutation. They reset on reload, as expected from a mocked API.

`useCars` falls back to writing the car straight to the cache if the mutation cannot be
delivered. The brief asks for the car to be stored in local state and treats the mocked
API call as an optional extra, so a transport failure should not lose the entry.
