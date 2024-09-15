import { TextField } from "@mui/material";
const { useState, useCallback } = React;

/**
 * Custom hook to manage multiple input fields.
 * @param {Object} initialValues - Initial values for the input fields.
 * @returns {Object} - An object containing the current values, change handler, and reset function.
 */
const useMultipleInputs = (initialValues) => {
  const [values, setValues] = useState(initialValues);

  // Handle change in input fields
  const handleChange = (event) => {
    const { id, value } = event.target;
    setValues((prevValues) => {
      return Object.assign({}, prevValues, {
        [id]: value,
      });
    });
  };
  const handleBoolChange = (event) => {
    const { id, checked } = event.target;
    setValues((prevValues) => {
      return Object.assign({}, prevValues, {
        [id]: checked,
      });
    });
  };

  // Reset all input fields to their initial values
  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return {
    values: values,
    handleChange: handleChange,
    handleBoolChange: handleBoolChange,
    reset: reset,
  };
};

export { useMultipleInputs };
