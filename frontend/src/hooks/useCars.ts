import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { v4 as uuid } from "uuid";
import { ADD_CAR, GET_CAR, GET_CARS } from "../graphql/queries";
import type {
  AddCarData,
  Car,
  CarFilter,
  CarInput,
  GetCarData,
  GetCarsData,
} from "../types/car";

export interface UseCarsResult {
  cars: Car[];
  loading: boolean;
  error?: Error;
  refetch: () => void;
  addCar: (input: CarInput) => Promise<Car>;
  adding: boolean;
}

export function useCars(): UseCarsResult {
  const client = useApolloClient();
  const { data, loading, error, refetch } = useQuery<GetCarsData>(GET_CARS);

  const [mutate, { loading: adding }] = useMutation<AddCarData, { input: CarInput }>(ADD_CAR);

  function cacheCar(car: Car): Car {
    client.cache.updateQuery<GetCarsData>({ query: GET_CARS }, (existing) => ({
      cars: [...(existing?.cars ?? []), car],
    }));

    return car;
  }

  async function addCar(input: CarInput): Promise<Car> {
    try {
      const result = await mutate({ variables: { input } });

      if (result.data?.addCar) {
        return cacheCar(result.data.addCar);
      }
    } catch {
      // The mocked API is an optional extra. When the mock is unreachable the car still
      // belongs in local state, so it is written straight to the cache instead.
    }

    return cacheCar({ __typename: "Car", id: uuid(), ...input } as Car);
  }

  return {
    cars: data?.cars ?? [],
    loading,
    error,
    refetch: () => {
      void refetch();
    },
    addCar,
    adding,
  };
}

export interface UseCarResult {
  car: Car | null;
  loading: boolean;
  error?: Error;
}

export function useCar(filter: CarFilter): UseCarResult {
  const hasFilter = Object.values(filter).some(
    (value) => value !== undefined && value !== null && value !== "",
  );

  const { data, loading, error } = useQuery<GetCarData, CarFilter>(GET_CAR, {
    variables: filter,
    skip: !hasFilter,
  });

  return { car: data?.car ?? null, loading, error };
}
