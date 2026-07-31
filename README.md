# Vehicle Makes Service

Backend service that pulls XML data from the NHTSA vPIC public API, transforms it into a
unified JSON structure, stores it in DynamoDB and exposes it through a single GraphQL
endpoint.

## Quick start

The only requirement is Docker. Node.js is not needed to run the service.

```bash
cd backend
docker compose up
```

That command builds the API image, starts DynamoDB, creates the table, ingests data from
the vPIC API and leaves the GraphQL endpoint ready at `http://localhost:3000/graphql`.

Verify it is running:

```bash
curl http://localhost:3000/health

curl http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ makes(limit: 2) { items { makeId makeName vehicleTypes { typeName } } } }"}'
```

Stop it with `docker compose down`. Ingested data persists in `backend/docker/dynamodb/`.

## Running locally without Docker

Requires Node.js 24 (see `backend/.nvmrc`). DynamoDB still runs in a container.

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d dynamodb
npm run ingest
npm run dev
```

`http://localhost:3000/graphql` then serves the Apollo Sandbox, an interactive explorer
for the schema.

## Scripts

| Command                    | Description                          |
| -------------------------- | ------------------------------------ |
| `npm run dev`              | Start the service with hot reload    |
| `npm run build`            | Compile TypeScript into `dist/`      |
| `npm start`                | Run the compiled service             |
| `npm run ingest`           | Run the ingestion pipeline once      |
| `npm test`                 | Unit tests, no external dependencies |
| `npm run test:integration` | Integration tests, requires DynamoDB |
| `npm run test:coverage`    | Every test plus a coverage report    |
| `npm run lint`             | ESLint                               |
| `npm run typecheck`        | TypeScript with no emit              |
| `npm run format`           | Apply Prettier                       |


### Application

| Variable    | Default       | Description                                                                                                    |
| ----------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`  | `development` | One of `development`, `test` or `production`. Controls log format and whether GraphQL introspection is enabled |
| `PORT`      | `3000`        | HTTP port                                                                                                      |
| `LOG_LEVEL` | `info`        | One of `error`, `warn`, `info` or `debug`                                                                      |

### External API

| Variable           | Default                                   | Description                                           |
| ------------------ | ----------------------------------------- | ----------------------------------------------------- |
| `VPIC_BASE_URL`    | `https://vpic.nhtsa.dot.gov/api/vehicles` | Base URL of the vPIC API                              |
| `VPIC_TIMEOUT_MS`  | `15000`                                   | Timeout per HTTP request, minimum `1000`              |
| `VPIC_MAX_RETRIES` | `3`                                       | Retries after the first attempt, between `0` and `10` |

### DynamoDB

| Variable                | Default                 | Description                                                                                          |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `DYNAMODB_ENDPOINT`     | `http://localhost:8000` | Endpoint of the local container. Leave empty to target real AWS and use the default credential chain |
| `DYNAMODB_REGION`       | `us-east-1`             | AWS region                                                                                           |
| `DYNAMODB_TABLE_NAME`   | `VehicleMakes`          | Table name, created automatically if missing                                                         |
| `AWS_ACCESS_KEY_ID`     | `local`                 | Only used when `DYNAMODB_ENDPOINT` is set                                                            |
| `AWS_SECRET_ACCESS_KEY` | `local`                 | Only used when `DYNAMODB_ENDPOINT` is set                                                            |
| `DYNAMODB_PORT`         | `8000`                  | Read by Docker Compose only, to publish the container on a free host port                            |

### Ingestion

| Variable                | Default | Description                                                                |
| ----------------------- | ------- | -------------------------------------------------------------------------- |
| `INGESTION_CONCURRENCY` | `10`    | Parallel requests against the vPIC API, between `1` and `50`               |
| `INGESTION_MAX_MAKES`   | `200`   | Makes to ingest. `0` ingests all 12,309                                    |
| `INGEST_ON_STARTUP`     | `false` | Run the ingestion when the service boots. Docker Compose sets it to `true` |


## Build

```bash
cd backend
npm run build   # compiles into dist/
npm start       # runs dist/index.js
```

```bash
docker build -t vehicle-makes-service ./backend
```

## GraphQL schema

A single endpoint, `POST /graphql`.

```graphql
type VehicleType {
  typeId: ID!
  typeName: String!
}

type VehicleMake {
  makeId: ID!
  makeName: String!
  vehicleTypes: [VehicleType!]!
  ingestedAt: String!
}

type MakeConnection {
  items: [VehicleMake!]!
  nextCursor: String
}

type Query {
  makes(limit: Int = 25, cursor: String): MakeConnection!
  make(makeId: ID!): VehicleMake
}
```

## Example queries

List makes with their vehicle types:

```graphql
query GetMakes {
  makes(limit: 5) {
    items {
      makeId
      makeName
      vehicleTypes {
        typeId
        typeName
      }
    }
    nextCursor
  }
}
```

Fetch a single make:

```graphql
query GetMake {
  make(makeId: "10785") {
    makeName
    vehicleTypes {
      typeName
    }
    ingestedAt
  }
}
```

Paginate using the cursor from a previous response:

```graphql
query GetNextPage($cursor: String) {
  makes(limit: 25, cursor: $cursor) {
    items {
      makeId
      makeName
    }
    nextCursor
  }
}
```

```json
{ "cursor": "eyJtYWtlSWQiOiIxMjc0NSJ9" }
```

Request only the fields you need. This returns names alone:

```graphql
query GetNames {
  makes(limit: 10) {
    items {
      makeName
    }
  }
}
```

From the command line:

```bash
curl http://localhost:3000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"query GetMake($id: ID!) { make(makeId: $id) { makeName } }","variables":{"id":"10785"}}'
```

## Tests

```bash
cd backend
npm test                  # 94 unit tests, no external dependencies
npm run test:integration  # 10 integration tests, requires DynamoDB
npm run test:coverage     # all 104 tests plus coverage
```

Unit tests mock every external dependency: the vPIC API through `fetch` and DynamoDB
through `aws-sdk-client-mock`. Integration tests run against a real DynamoDB Local and
mock only the vPIC API, covering ingestion, persistence and GraphQL serving end to end.

## Further documentation

- [backend/docs/ARCHITECTURE.md](backend/docs/ARCHITECTURE.md) — ingestion pipeline, error
  handling, logging and configuration strategy
- [backend/docs/API.md](backend/docs/API.md) — full GraphQL reference and error codes

## Project layout

```text
.
├── .github/workflows/ci.yml
├── README.md
└── backend/
    ├── docs/
    ├── docker/dynamodb/
    ├── src/
    │   ├── __tests__/        unit and integration tests
    │   ├── clients/          vPIC HTTP client
    │   ├── config/           validated environment and DynamoDB client
    │   ├── graphql/          schema and resolvers
    │   ├── middlewares/      error handling
    │   ├── mocks/            XML fixtures
    │   ├── models/           domain types and table definition
    │   ├── repositories/     DynamoDB access
    │   ├── routes/           HTTP routes
    │   ├── scripts/          ingestion entry point
    │   ├── services/         transformation, ingestion and read logic
    │   └── utils/            logger, XML parser, errors, concurrency
    ├── Dockerfile
    └── docker-compose.yml
```
