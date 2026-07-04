import {
  PDFDocument,
  PDFField,
  PDFWidgetAnnotation,
} from "@cantoo/pdf-lib";
import { readFileAsArrayBuffer } from "./readFile";

/** Supported AcroForm field kinds exposed in the UI. */
export type FormFieldKind =
  | "text"
  | "checkbox"
  | "radio"
  | "dropdown"
  | "optionList"
  | "button"
  | "signature"
  | "unknown";

/** Widget rectangle in PDF point space (origin bottom-left). */
export type FormWidgetRect = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Serializable field metadata for sidebar + overlay rendering. */
export type FormFieldDescriptor = {
  name: string;
  kind: FormFieldKind;
  value: string | boolean;
  options: string[];
  readOnly: boolean;
  required: boolean;
  multiline: boolean;
  widgets: FormWidgetRect[];
};

export type FormFieldValues = Record<string, string | boolean>;

export type FillPdfFormOptions = {
  /** When true, burn field appearances into page content and remove interactivity. */
  flatten?: boolean;
};

export class FormValidationError extends Error {
  readonly missingFields: string[];

  constructor(missingFields: string[]) {
    super(`Required form fields are empty: ${missingFields.join(", ")}`);
    this.name = "FormValidationError";
    this.missingFields = missingFields;
  }
}

/** Resolve widget page index using page refs and annotation lookup. */
function resolveWidgetPageIndex(
  doc: PDFDocument,
  widget: PDFWidgetAnnotation,
): number {
  const pages = doc.getPages();
  const pageRef = widget.P();
  if (pageRef) {
    const direct = pages.findIndex((p) => p.ref === pageRef);
    if (direct >= 0) return direct;
  }

  const widgetRef = doc.context.getObjectRef(widget.dict);
  if (widgetRef) {
    const page = doc.findPageForAnnotationRef(widgetRef);
    if (page) {
      const idx = pages.indexOf(page);
      if (idx >= 0) return idx;
    }
  }

  return 0;
}

/** Collect widget rectangles for a field. */
function collectWidgets(doc: PDFDocument, field: PDFField): FormWidgetRect[] {
  return field.acroField.getWidgets().map((widget) => {
    const rect = widget.getRectangle();
    return {
      pageIndex: resolveWidgetPageIndex(doc, widget),
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  });
}

/** Map a pdf-lib field instance to our descriptor shape. */
function describeField(
  doc: PDFDocument,
  form: ReturnType<PDFDocument["getForm"]>,
  field: PDFField,
): FormFieldDescriptor {
  const name = field.getName();
  const base = {
    name,
    readOnly: field.isReadOnly(),
    required: field.isRequired(),
    widgets: collectWidgets(doc, field),
    multiline: false,
    options: [] as string[],
    value: "" as string | boolean,
    kind: "unknown" as FormFieldKind,
  };

  try {
    const textField = form.getTextField(name);
    return {
      ...base,
      kind: "text",
      value: textField.getText() ?? "",
      multiline: textField.isMultiline(),
    };
  } catch {
    /* not a text field */
  }

  try {
    const checkBox = form.getCheckBox(name);
    return {
      ...base,
      kind: "checkbox",
      value: checkBox.isChecked(),
    };
  } catch {
    /* not a checkbox */
  }

  try {
    const radio = form.getRadioGroup(name);
    return {
      ...base,
      kind: "radio",
      value: radio.getSelected() ?? "",
      options: radio.getOptions(),
    };
  } catch {
    /* not a radio group */
  }

  try {
    const dropdown = form.getDropdown(name);
    return {
      ...base,
      kind: "dropdown",
      value: dropdown.getSelected().join(", "),
      options: dropdown.getOptions(),
    };
  } catch {
    /* not a dropdown */
  }

  try {
    const optionList = form.getOptionList(name);
    return {
      ...base,
      kind: "optionList",
      value: optionList.getSelected().join(", "),
      options: optionList.getOptions(),
    };
  } catch {
    /* not an option list */
  }

  try {
    form.getButton(name);
    return { ...base, kind: "button", value: "" };
  } catch {
    /* not a button */
  }

  try {
    form.getSignature(name);
    return { ...base, kind: "signature", value: "" };
  } catch {
    /* not a signature */
  }

  return base;
}

/** List interactive AcroForm fields and current values from PDF bytes. */
export async function listPdfFormFields(
  bytes: ArrayBuffer | Uint8Array,
): Promise<FormFieldDescriptor[]> {
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  if (form.hasXFA()) {
    form.deleteXFA();
  }
  return form.getFields().map((field) => describeField(doc, form, field));
}

/** Return names of required fields that are empty in `values`. */
export function findMissingRequiredFields(
  fields: FormFieldDescriptor[],
  values: FormFieldValues,
): string[] {
  return fields
    .filter((f) => f.required && !f.readOnly && f.kind !== "button" && f.kind !== "signature")
    .filter((f) => {
      const current = values[f.name];
      if (f.kind === "checkbox") return current !== true;
      if (typeof current !== "string") return true;
      return current.trim() === "";
    })
    .map((f) => f.name);
}

/** Apply user values to matching fields (skips read-only). */
function applyFieldValues(
  form: ReturnType<PDFDocument["getForm"]>,
  values: FormFieldValues,
): void {
  for (const [name, raw] of Object.entries(values)) {
    const field = form.getFieldMaybe(name);
    if (!field || field.isReadOnly()) continue;

    try {
      const textField = form.getTextField(name);
      textField.setText(typeof raw === "string" ? raw : String(raw));
      continue;
    } catch {
      /* not text */
    }

    try {
      const checkBox = form.getCheckBox(name);
      if (raw === true || raw === "true") checkBox.check();
      else checkBox.uncheck();
      continue;
    } catch {
      /* not checkbox */
    }

    try {
      const radio = form.getRadioGroup(name);
      if (typeof raw === "string" && raw) radio.select(raw);
      continue;
    } catch {
      /* not radio */
    }

    try {
      const dropdown = form.getDropdown(name);
      if (typeof raw === "string" && raw) dropdown.select(raw);
      continue;
    } catch {
      /* not dropdown */
    }

    try {
      const optionList = form.getOptionList(name);
      if (typeof raw === "string" && raw) {
        const selected = raw.split(",").map((s) => s.trim()).filter(Boolean);
        optionList.select(selected);
      }
    } catch {
      /* not option list */
    }
  }
}

/**
 * Fill AcroForm fields and optionally flatten. Validates required fields when
 * `fields` metadata is supplied (from {@link listPdfFormFields}).
 */
export async function fillPdfForm(
  file: File,
  values: FormFieldValues,
  options: FillPdfFormOptions = {},
  fieldsForValidation?: FormFieldDescriptor[],
): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const descriptors = fieldsForValidation ?? (await listPdfFormFields(bytes));
  const missing = findMissingRequiredFields(descriptors, values);
  if (missing.length > 0) {
    throw new FormValidationError(missing);
  }

  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  if (form.hasXFA()) {
    form.deleteXFA();
  }

  applyFieldValues(form, values);
  form.updateFieldAppearances();

  if (options.flatten) {
    form.flatten();
  }

  return doc.save();
}

/** Build initial values map from parsed field descriptors. */
export function initialValuesFromFields(
  fields: FormFieldDescriptor[],
): FormFieldValues {
  return Object.fromEntries(fields.map((f) => [f.name, f.value]));
}
