import type { ReactNode } from "react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ADD_CAR, GET_CARS } from "../graphql/queries";
import { useCars } from "../hooks/useCars";
import type { CarInput } from "../types/car";

const audiQ5 = {
  __typename: "Car",
  id: "1",
  make: "Audi",
  model: "Q5",
  year: 2023,
  color: "Blue",
  mobile: "m.png",
  tablet: "t.png",
  desktop: "d.png",
};

const carsMock: MockedResponse = {
  request: { query: GET_CARS },
  result: { data: { cars: [audiQ5] } },
};

const newCarInput: CarInput = {
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  color: "Silver",
  mobile: "",
  tablet: "",
  desktop: "",
};

function wrapper(mocks: MockedResponse[]) {
  return ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );
}

describe("useCars", () => {
  it("starts in a loading state with no cars", () => {
    const { result } = renderHook(() => useCars(), { wrapper: wrapper([carsMock]) });

    expect(result.current.loading).toBe(true);
    expect(result.current.cars).toEqual([]);
  });

  it("returns the cars once the query resolves", async () => {
    const { result } = renderHook(() => useCars(), { wrapper: wrapper([carsMock]) });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cars).toHaveLength(1);
    expect(result.current.cars[0].model).toBe("Q5");
  });

  it("surfaces a query error and keeps the list empty", async () => {
    const failing: MockedResponse = {
      request: { query: GET_CARS },
      error: new Error("network down"),
    };

    const { result } = renderHook(() => useCars(), { wrapper: wrapper([failing]) });

    await waitFor(() => expect(result.current.error).toBeDefined());

    expect(result.current.error?.message).toContain("network down");
    expect(result.current.cars).toEqual([]);
  });

  it("adds the created car to the list", async () => {
    const created = { ...audiQ5, id: "99", make: "Toyota", model: "Corolla", year: 2020 };

    const addMock: MockedResponse = {
      request: { query: ADD_CAR, variables: { input: newCarInput } },
      result: { data: { addCar: created } },
    };

    const { result } = renderHook(() => useCars(), {
      wrapper: wrapper([carsMock, addMock]),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addCar(newCarInput);
    });

    await waitFor(() => expect(result.current.cars).toHaveLength(2));
    expect(result.current.cars.map((car) => car.model)).toContain("Corolla");
  });

  it("still stores the car locally when the mutation fails", async () => {
    const failingAdd: MockedResponse = {
      request: { query: ADD_CAR, variables: { input: newCarInput } },
      error: new Error("worker unavailable"),
    };

    const { result } = renderHook(() => useCars(), {
      wrapper: wrapper([carsMock, failingAdd]),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addCar(newCarInput);
    });

    await waitFor(() => expect(result.current.cars).toHaveLength(2));
    expect(result.current.cars.map((car) => car.model)).toContain("Corolla");
  });
});
