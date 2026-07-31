export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  mobile: string;
  tablet: string;
  desktop: string;
}

export type CarImageSize = "mobile" | "tablet" | "desktop";

export interface CarFilter {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
}

export interface GetCarsData {
  cars: Car[];
}

export interface GetCarData {
  car: Car | null;
}

export type CarInput = Omit<Car, "id">;

export interface AddCarData {
  addCar: Car;
}
