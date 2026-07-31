import type { CarInput } from "../types/car";

export const CURRENT_YEAR = new Date().getFullYear();
export const EARLIEST_YEAR = 1900;

export interface CarFormValues {
  make: string;
  model: string;
  year: string;
  color: string;
  imageUrl: string;
}

export type CarFormErrors = Partial<Record<keyof CarFormValues, string>>;

export const EMPTY_CAR_FORM: CarFormValues = {
  make: "",
  model: "",
  year: String(CURRENT_YEAR),
  color: "",
  imageUrl: "",
};

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateCarForm(values: CarFormValues): CarFormErrors {
  const errors: CarFormErrors = {};

  if (values.make.trim() === "") {
    errors.make = "Make is required";
  }
  if (values.model.trim() === "") {
    errors.model = "Model is required";
  }
  if (values.color.trim() === "") {
    errors.color = "Color is required";
  }

  const year = Number(values.year);
  if (values.year.trim() === "") {
    errors.year = "Year is required";
  } else if (!Number.isInteger(year)) {
    errors.year = "Year must be a whole number";
  } else if (year < EARLIEST_YEAR || year > CURRENT_YEAR + 1) {
    errors.year = `Year must be between ${EARLIEST_YEAR} and ${CURRENT_YEAR + 1}`;
  }

  if (values.imageUrl.trim() !== "" && !isValidUrl(values.imageUrl.trim())) {
    errors.imageUrl = "Enter a valid http or https URL";
  }

  return errors;
}

export function toCarInput(values: CarFormValues): CarInput {
  const image = values.imageUrl.trim();

  return {
    make: values.make.trim(),
    model: values.model.trim(),
    year: Number(values.year),
    color: values.color.trim(),
    mobile: image,
    tablet: image,
    desktop: image,
  };
}
