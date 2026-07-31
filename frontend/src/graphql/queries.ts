import { gql } from "@apollo/client";

export const CAR_FIELDS = gql`
  fragment CarFields on Car {
    id
    make
    model
    year
    color
    mobile
    tablet
    desktop
  }
`;

export const GET_CARS = gql`
  query GetCars {
    cars {
      ...CarFields
    }
  }
  ${CAR_FIELDS}
`;

export const GET_CAR = gql`
  query GetCar($make: String, $model: String, $year: Int, $color: String) {
    car(make: $make, model: $model, year: $year, color: $color) {
      ...CarFields
    }
  }
  ${CAR_FIELDS}
`;

export const ADD_CAR = gql`
  mutation AddCar($input: CarInput!) {
    addCar(input: $input) {
      ...CarFields
    }
  }
  ${CAR_FIELDS}
`;
