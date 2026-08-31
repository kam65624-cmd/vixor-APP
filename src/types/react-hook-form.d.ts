// Type declaration for react-hook-form (used by shadcn/ui Form component)
// This is a minimal stub — replace with full @types/react-hook-form if needed.

declare module "react-hook-form" {
  import {
    type ComponentPropsWithoutRef,
    type ForwardRefExoticComponent,
    type ReactNode,
  } from "react";

  export type FieldValues = Record<string, any>;
  export type FieldPath<TFieldValues extends FieldValues> = string &
    {
      [K in keyof TFieldValues & string]: TFieldValues[K];
    }[keyof TFieldValues & string];

  export type FieldError = {
    type: string;
    ref?: any;
    types?: Record<string, any>;
    message?: string;
  };

  export type FieldErrors<TFieldValues extends FieldValues = FieldValues> = {
    [K in keyof TFieldValues]?: FieldError | FieldError[];
  };

  export type FormState<TFieldValues extends FieldValues = FieldValues> = {
    errors: FieldErrors<TFieldValues>;
    isDirty: boolean;
    isValidating: boolean;
    dirtyFields: Partial<Record<keyof TFieldValues, boolean>>;
    touchedFields: Partial<Record<keyof TFieldValues, boolean>>;
    isSubmitting: boolean;
    isValid: boolean;
    submitCount: number;
  };

  export type UseFormReturn<TFieldValues extends FieldValues = FieldValues> = {
    register: any;
    handleSubmit: any;
    reset: any;
    formState: FormState<TFieldValues>;
    getFieldState: (
      name: FieldPath<TFieldValues>,
      formState: FormState<TFieldValues>,
    ) => {
      invalid: boolean;
      isDirty: boolean;
      isTouched: boolean;
      error?: FieldError;
    };
    control: any;
    getValues: any;
    setValue: any;
    trigger: any;
    watch: any;
    clearErrors: any;
    setError: any;
    unregister: any;
  };

  export type UseFormProps<TFieldValues extends FieldValues = FieldValues> = {
    defaultValues?: Partial<TFieldValues>;
    values?: TFieldValues;
    mode?: "onChange" | "onBlur" | "onSubmit" | "all";
    reValidateMode?: "onChange" | "onBlur" | "onSubmit";
    resolver?: any;
    context?: any;
    shouldFocusError?: boolean;
    shouldUnregister?: boolean;
    criteriaMode?: "firstError" | "all";
    delayError?: number;
  };

  export function useForm<TFieldValues extends FieldValues = FieldValues>(
    props?: UseFormProps<TFieldValues>,
  ): UseFormReturn<TFieldValues>;

  export type ControllerProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  > = {
    name: TName;
    control: any;
    rules?: any;
    shouldUnregister?: boolean;
    defaultValue?: TFieldValues[TName];
    render: (props: {
      field: {
        value: TFieldValues[TName];
        onChange: (...event: any[]) => void;
        onBlur: (...event: any[]) => void;
        ref: any;
        name: TName;
      };
      fieldState: { invalid: boolean; isTouched: boolean; isDirty: boolean; error?: FieldError };
      formState: FormState<TFieldValues>;
    }) => ReactNode;
  };

  export type ControllerPropsWithoutName<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  > = Omit<ControllerProps<TFieldValues, TName>, "name">;

  export function Controller<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(props: ControllerProps<TFieldValues, TName>): any;

  export type FormProviderProps<TFieldValues extends FieldValues = FieldValues> = {
    children: ReactNode;
  } & UseFormReturn<TFieldValues>;

  export const FormProvider: <TFieldValues extends FieldValues = FieldValues>(
    props: FormProviderProps<TFieldValues>,
  ) => any;

  export function useFormContext<
    TFieldValues extends FieldValues = FieldValues,
  >(): UseFormReturn<TFieldValues>;
}
