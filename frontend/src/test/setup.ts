import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { DESKTOP_WIDTH, installMatchMedia, setViewportWidth } from "./viewport";

beforeEach(() => {
  setViewportWidth(DESKTOP_WIDTH);
  installMatchMedia();
});

afterEach(() => {
  cleanup();
});
