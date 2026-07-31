export const typeDefs = `#graphql
  "A category of vehicle a manufacturer produces, as classified by NHTSA."
  type VehicleType {
    "NHTSA identifier of the vehicle type."
    typeId: ID!

    "Human readable name, for example \\"Passenger Car\\"."
    typeName: String!
  }

  "A vehicle manufacturer together with the vehicle types it produces."
  type VehicleMake {
    "NHTSA identifier of the manufacturer."
    makeId: ID!

    "Registered name of the manufacturer."
    makeName: String!

    "Vehicle types produced by this manufacturer. Empty when NHTSA reports none."
    vehicleTypes: [VehicleType!]!

    "ISO-8601 timestamp of the ingestion run that stored this record."
    ingestedAt: String!
  }

  "A page of vehicle makes plus the cursor needed to request the next one."
  type MakeConnection {
    "Vehicle makes in this page."
    items: [VehicleMake!]!

    "Opaque cursor for the next page. Null when there are no more results."
    nextCursor: String
  }

  type Query {
    """
    Returns a page of vehicle makes.
    The limit is capped server side, so requesting more than the maximum returns the maximum.
    Pass the nextCursor from a previous response to read the following page.
    """
    makes(limit: Int = 25, cursor: String): MakeConnection!

    "Returns a single vehicle make by its NHTSA identifier, or null when it does not exist."
    make(makeId: ID!): VehicleMake
  }
`;
