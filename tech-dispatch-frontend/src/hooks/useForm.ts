import { useState, useCallback } from "react";

interface FormErrors {
  [key: string]: string;
}

interface UseFormOptions<T> {
  initialValues: T;
  validate: (values: T) => FormErrors;
  onSubmit: (values: T) => void | Promise<void>;
}

export const useForm = <T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(
    (key: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      if (errors[key as string]) {
        setErrors((prev) => ({ ...prev, [key]: "" }));
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validate(values);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  return { values, errors, isSubmitting, setValue, handleSubmit, setErrors };
};

// Common validators
export const validators = {
  email: (email: string) => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email";
    return "";
  },
  password: (password: string, minLength = 8) => {
    if (!password) return "Password is required";
    if (password.length < minLength) return `Password must be at least ${minLength} characters`;
    return "";
  },
  phone: (phone: string) => {
    if (!phone) return "";
    const nepaliPhoneRegex = /^(?:\+?977[- \s]?)?(?:98|97|96)\d{8}$/;
    if (!nepaliPhoneRegex.test(phone)) return "Please enter a valid Nepali phone number (e.g., 98xxxxxxxx)";
    return "";
  },
  required: (value: string, fieldName: string) => {
    if (!value?.trim()) return `${fieldName} is required`;
    return "";
  },
};
