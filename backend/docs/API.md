# API reference

The service exposes one GraphQL endpoint plus a health check.

| Method | Path       | Description                                           |
| ------ | ---------- | ----------------------------------------------------- |
| `POST` | `/graphql` | Every read operation                                  |
| `GET`  | `/graphql` | Apollo Sandbox in development, disabled in production |
| `GET`  | `/health`  | Liveness probe                                        |

## Health check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "uptime": 42.86,
  "timestamp": "2026-07-31T06:55:25.923Z"
}
```

## GraphQL transport

```
POST /graphql
Content-Type: application/json
```

```json
{
  "query": "query GetMake($id: ID!) { make(makeId: $id) { makeName } }",
  "variables": { "id": "10785" },
  "operationName": "GetMake"
}
```

Only `query` is required. Prefer `variables` over interpolating values into the query
string.

Two details that differ from REST:

- Business errors still return HTTP `200`, with the problem inside `errors`. Malformed
  queries return `400`.
- There is a single URL. `limit` is a GraphQL argument, not a query parameter, so
  `/graphql?limit=5` does not exist.

`GET` requests are supported but require the `x-apollo-operation-name` header, which
Apollo enforces as CSRF protection. Use `POST`.

## Types

### VehicleMake

| Field          | Type              | Description                                           |
| -------------- | ----------------- | ----------------------------------------------------- |
| `makeId`       | `ID!`             | NHTSA identifier of the manufacturer                  |
| `makeName`     | `String!`         | Registered name                                       |
| `vehicleTypes` | `[VehicleType!]!` | Vehicle types produced. Empty when NHTSA reports none |
| `ingestedAt`   | `String!`         | ISO-8601 timestamp of the run that stored the record  |

### VehicleType

| Field      | Type      | Description                                  |
| ---------- | --------- | -------------------------------------------- |
| `typeId`   | `ID!`     | NHTSA identifier of the vehicle type         |
| `typeName` | `String!` | Human readable name, such as `Passenger Car` |

### MakeConnection

| Field        | Type              | Description                                      |
| ------------ | ----------------- | ------------------------------------------------ |
| `items`      | `[VehicleMake!]!` | Makes in this page                               |
| `nextCursor` | `String`          | Cursor for the next page, `null` on the last one |



## Errors

Errors arrive in an `errors` array, each with a code in `extensions.code`. Stack traces
are never sent to the client.

| Code                        | HTTP | Cause                                                         |
| --------------------------- | ---- | ------------------------------------------------------------- |
| `GRAPHQL_VALIDATION_FAILED` | 400  | Unknown field, wrong argument type, missing required argument |
| `GRAPHQL_PARSE_FAILED`      | 400  | The query is not valid GraphQL syntax                         |
| `BAD_USER_INPUT`            | 400  | Malformed variables                                           |
| `PersistenceError`          | 200  | DynamoDB rejected the read, or the cursor is corrupt          |
| `ExternalApiError`          | 200  | The vPIC API failed during an ingestion triggered at startup  |
| `INTROSPECTION_DISABLED`    | 400  | `__schema` or `__type` queried in production                  |

Unknown field:

```json
{
  "errors": [
    {
      "message": "Cannot query field \"unknownField\" on type \"VehicleMake\".",
      "locations": [{ "line": 1, "column": 29 }],
      "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" }
    }
  ]
}
```

Corrupt cursor:

```json
{
  "errors": [
    {
      "message": "Invalid pagination cursor",
      "extensions": { "code": "PersistenceError" }
    }
  ],
  "data": null
}
```

Argument validation comes from the schema itself, so wrong types are rejected before any
resolver runs. There is no extra validation layer on this path.

