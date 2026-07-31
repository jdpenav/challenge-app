import { describe, expect, it } from "vitest";
import {
  CURRENT_YEAR,
  EMPTY_CAR_FORM,
  toCarInput,
  validateCarForm,
  type CarFormValues,
} from "../utils/carForm";

function form(overrides: Partial<CarFormValues> = {}): CarFormValues {
  return { ...EMPTY_CAR_FORM, make: "Audi", model: "Q5", color: "Blue", ...overrides };
}

describe("validateCarForm", () => {
  it("accepts a complete form", () => {
    expect(validateCarForm(form())).toEqual({});
  });

  it.each(["make", "model", "color"] as const)("requires %s", (field) => {
    const errors = validateCarForm(form({ [field]: "   " }));
    expect(errors[field]).toBeDefined();
  });

  it("reports every missing field at once", () => {
    const errors = validateCarForm(EMPTY_CAR_FORM);

    expect(Object.keys(errors).sort()).toEqual(["color", "make", "model"]);
  });

  it("requires a year", () => {
    expect(validateCarForm(form({ year: "" })).year).toBeDefined();
  });

  it("rejects a year before 1900", () => {
    expect(validateCarForm(form({ year: "1899" })).year).toBeDefined();
  });

  it("rejects a year too far in the future", () => {
    expect(validateCarForm(form({ year: String(CURRENT_YEAR + 2) })).year).toBeDefined();
  });

  it("accepts next year", () => {
    expect(validateCarForm(form({ year: String(CURRENT_YEAR + 1) })).year).toBeUndefined();
  });

  it("rejects a fractional year", () => {
    expect(validateCarForm(form({ year: "2020.5" })).year).toBeDefined();
  });

  it("treats the image as optional", () => {
    expect(validateCarForm(form({ imageUrl: "" })).imageUrl).toBeUndefined();
  });

  it.each(["not-a-url", "ftp://example.com/car.png", "example.com/car.png"])(
    "rejects %s as an image url",
    (value) => {
      expect(validateCarForm(form({ imageUrl: value })).imageUrl).toBeDefined();
    },
  );

  it.each(["http://example.com/car.png", "https://example.com/car.png"])(
    "accepts %s as an image url",
    (value) => {
      expect(validateCarForm(form({ imageUrl: value })).imageUrl).toBeUndefined();
    },
  );
});

describe("toCarInput", () => {
  it("trims the text fields", () => {
    const input = toCarInput(form({ make: "  Audi  ", model: "  Q5  ", color: "  Blue  " }));

    expect(input).toMatchObject({ make: "Audi", model: "Q5", color: "Blue" });
  });

  it("converts the year to a number", () => {
    const input = toCarInput(form({ year: "2020" }));

    expect(input.year).toBe(2020);
  });

  it("uses one url for the three sizes", () => {
    const input = toCarInput(form({ imageUrl: "https://example.com/car.png" }));

    expect(input.mobile).toBe("https://example.com/car.png");
    expect(input.tablet).toBe(input.mobile);
    expect(input.desktop).toBe(input.mobile);
  });

  it("leaves the images empty when no url is given", () => {
    const input = toCarInput(form({ imageUrl: "" }));

    expect([input.mobile, input.tablet, input.desktop]).toEqual(["", "", ""]);
  });
});
