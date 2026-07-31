import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddCarDialog } from "../components/AddCarDialog";
import { renderWithTheme } from "../test/render";

function setup(overrides: Partial<React.ComponentProps<typeof AddCarDialog>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  renderWithTheme(
    <AddCarDialog open submitting={false} onClose={onClose} onSubmit={onSubmit} {...overrides} />,
  );

  return { onSubmit, onClose };
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText("Make"), "Toyota");
  await userEvent.type(screen.getByLabelText("Model"), "Corolla");
  await userEvent.type(screen.getByLabelText("Color"), "Silver");
}

describe("AddCarDialog", () => {
  it("blocks submission and shows errors when the form is empty", async () => {
    const { onSubmit } = setup();

    await userEvent.click(screen.getByRole("button", { name: "Add car" }));

    expect(await screen.findByText("Make is required")).toBeInTheDocument();
    expect(screen.getByText("Model is required")).toBeInTheDocument();
    expect(screen.getByText("Color is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an out of range year", async () => {
    const { onSubmit } = setup();

    await fillValidForm();
    await userEvent.clear(screen.getByLabelText("Year"));
    await userEvent.type(screen.getByLabelText("Year"), "1800");
    await userEvent.click(screen.getByRole("button", { name: "Add car" }));

    expect(await screen.findByText(/Year must be between/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an invalid image url", async () => {
    const { onSubmit } = setup();

    await fillValidForm();
    await userEvent.type(screen.getByLabelText("Image URL"), "not-a-url");
    await userEvent.click(screen.getByRole("button", { name: "Add car" }));

    expect(await screen.findByText("Enter a valid http or https URL")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears a field error as soon as it is edited", async () => {
    setup();

    await userEvent.click(screen.getByRole("button", { name: "Add car" }));
    expect(await screen.findByText("Make is required")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Make"), "T");

    expect(screen.queryByText("Make is required")).not.toBeInTheDocument();
  });

  it("submits the trimmed values with the year as a number", async () => {
    const { onSubmit, onClose } = setup();

    await fillValidForm();
    await userEvent.clear(screen.getByLabelText("Year"));
    await userEvent.type(screen.getByLabelText("Year"), "2020");
    await userEvent.click(screen.getByRole("button", { name: "Add car" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      color: "Silver",
      mobile: "",
      tablet: "",
      desktop: "",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the dialog open and reports a failed submission", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Server unavailable"));
    const onClose = vi.fn();

    renderWithTheme(
      <AddCarDialog open submitting={false} onClose={onClose} onSubmit={onSubmit} />,
    );

    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Add car" }));

    expect(await screen.findByText("Server unavailable")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("disables the actions while submitting", () => {
    setup({ submitting: true });

    expect(screen.getByRole("button", { name: "Adding…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
