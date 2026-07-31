import { graphql, HttpResponse } from "msw";
import { v4 as uuid } from "uuid";
import { carList } from "./carList";
import type { Car, CarFilter, CarInput } from "../types/car";

type CarResponse = Car & { __typename: "Car" };

function withTypename(car: Car): CarResponse {
  return { __typename: "Car", ...car };
}

function matches(car: Car, filter: CarFilter): boolean {
  const sameText = (value: string, expected?: string) =>
    expected === undefined || expected === null
      ? true
      : value.toLowerCase() === expected.toLowerCase();

  return (
    sameText(car.make, filter.make) &&
    sameText(car.model, filter.model) &&
    sameText(car.color, filter.color) &&
    (filter.year === undefined || filter.year === null || car.year === filter.year)
  );
}

export const handlers = [
  graphql.query("GetCars", () => {
    return HttpResponse.json({ data: { cars: carList.map(withTypename) } });
  }),

  graphql.query<{ car: CarResponse | null }, CarFilter>("GetCar", ({ variables }) => {
    const car = carList.find((candidate) => matches(candidate, variables));
    return HttpResponse.json({ data: { car: car ? withTypename(car) : null } });
  }),

  graphql.mutation<{ addCar: CarResponse }, { input: CarInput }>("AddCar", ({ variables }) => {
    const car: Car = { id: uuid(), ...variables.input };
    carList.push(car);

    return HttpResponse.json({ data: { addCar: withTypename(car) } });
  }),
];