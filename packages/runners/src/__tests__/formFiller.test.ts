import { describe, it, expect } from "vitest";
import { PDFDocument } from "@cantoo/pdf-lib";
import {
  fillPdfForm,
  findMissingRequiredFields,
  FormValidationError,
  initialValuesFromFields,
  listPdfFormFields,
} from "../formFiller";

async function createFormPdf(): Promise<File> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 600]);
  const form = doc.getForm();

  const nameField = form.createTextField("applicant.name");
  nameField.setText("Jane");
  nameField.enableRequired();
  nameField.addToPage(page, { x: 50, y: 500, width: 200, height: 24 });

  const agree = form.createCheckBox("agree.terms");
  agree.addToPage(page, { x: 50, y: 450, width: 18, height: 18 });

  const role = form.createDropdown("role");
  role.addOptions(["Engineer", "Designer"]);
  role.select("Engineer");
  role.addToPage(page, { x: 50, y: 400, width: 160, height: 22 });

  const bytes = await doc.save();
  return new File([bytes], "form.pdf", { type: "application/pdf" });
}

describe("listPdfFormFields", () => {
  it("detects text, checkbox, and dropdown fields", async () => {
    const file = await createFormPdf();
    const fields = await listPdfFormFields(await file.arrayBuffer());

    expect(fields.map((f) => f.name).sort()).toEqual(
      ["agree.terms", "applicant.name", "role"].sort(),
    );

    const name = fields.find((f) => f.name === "applicant.name");
    expect(name?.kind).toBe("text");
    expect(name?.value).toBe("Jane");
    expect(name?.required).toBe(true);
    expect(name?.widgets[0]?.pageIndex).toBe(0);
  });
});

describe("findMissingRequiredFields", () => {
  it("flags empty required text fields", async () => {
    const file = await createFormPdf();
    const fields = await listPdfFormFields(await file.arrayBuffer());
    const values = initialValuesFromFields(fields);
    values["applicant.name"] = "";

    expect(findMissingRequiredFields(fields, values)).toEqual(["applicant.name"]);
  });
});

describe("fillPdfForm", () => {
  it("persists updated values into the PDF dictionary", async () => {
    const file = await createFormPdf();
    const fields = await listPdfFormFields(await file.arrayBuffer());
    const values = initialValuesFromFields(fields);
    values["applicant.name"] = "John Doe";
    values["agree.terms"] = true;
    values.role = "Designer";

    const out = await fillPdfForm(file, values, {}, fields);
    const roundTrip = await listPdfFormFields(out);

    expect(roundTrip.find((f) => f.name === "applicant.name")?.value).toBe("John Doe");
    expect(roundTrip.find((f) => f.name === "agree.terms")?.value).toBe(true);
    expect(roundTrip.find((f) => f.name === "role")?.value).toBe("Designer");
  });

  it("throws when required fields are missing", async () => {
    const file = await createFormPdf();
    const fields = await listPdfFormFields(await file.arrayBuffer());
    const values = initialValuesFromFields(fields);
    values["applicant.name"] = "";

    await expect(fillPdfForm(file, values, {}, fields)).rejects.toBeInstanceOf(
      FormValidationError,
    );
  });

  it("can flatten filled forms", async () => {
    const file = await createFormPdf();
    const fields = await listPdfFormFields(await file.arrayBuffer());
    const values = initialValuesFromFields(fields);
    values["applicant.name"] = "Flat User";

    const out = await fillPdfForm(file, values, { flatten: true }, fields);
    const doc = await PDFDocument.load(out);
    expect(doc.getForm().getFields()).toHaveLength(0);
  });
});
