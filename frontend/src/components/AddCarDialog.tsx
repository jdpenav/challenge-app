import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import type { CarInput } from "../types/car";
import {
  EMPTY_CAR_FORM,
  toCarInput,
  validateCarForm,
  type CarFormErrors,
  type CarFormValues,
} from "../utils/carForm";

interface AddCarDialogProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CarInput) => Promise<unknown>;
}

export function AddCarDialog({ open, submitting, onClose, onSubmit }: AddCarDialogProps) {
  const [values, setValues] = useState<CarFormValues>(EMPTY_CAR_FORM);
  const [errors, setErrors] = useState<CarFormErrors>({});
  const [submitError, setSubmitError] = useState<string>();

  function update(field: keyof CarFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function close() {
    setValues(EMPTY_CAR_FORM);
    setErrors({});
    setSubmitError(undefined);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const found = validateCarForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    try {
      setSubmitError(undefined);
      await onSubmit(toCarInput(values));
      close();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ typography: "h2" }}>Add a car</DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}

          <TextField
            label="Make"
            value={values.make}
            onChange={(event) => update("make", event.target.value)}
            error={Boolean(errors.make)}
            helperText={errors.make}
            size="small"
            autoFocus
            fullWidth
          />

          <TextField
            label="Model"
            value={values.model}
            onChange={(event) => update("model", event.target.value)}
            error={Boolean(errors.model)}
            helperText={errors.model}
            size="small"
            fullWidth
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Year"
              type="number"
              value={values.year}
              onChange={(event) => update("year", event.target.value)}
              error={Boolean(errors.year)}
              helperText={errors.year}
              size="small"
              fullWidth
            />

            <TextField
              label="Color"
              value={values.color}
              onChange={(event) => update("color", event.target.value)}
              error={Boolean(errors.color)}
              helperText={errors.color}
              size="small"
              fullWidth
            />
          </Box>

          <TextField
            label="Image URL"
            value={values.imageUrl}
            onChange={(event) => update("imageUrl", event.target.value)}
            error={Boolean(errors.imageUrl)}
            helperText={errors.imageUrl ?? "Optional"}
            size="small"
            fullWidth
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Adding…" : "Add car"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
