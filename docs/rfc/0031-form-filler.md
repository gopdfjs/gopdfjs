# RFC 0031 - Form Filler

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Efficiently detect and fill interactive PDF forms (`AcroForms`) in the browser.

## 2. Technical Specification
- **Core Library**: `pdf-lib` (Form module)
- **Processing Logic**: 
    - Identify interactive widgets (`/Widget`) and their corresponding field names.
    - Generate a dynamic HTML form matching the PDF fields (Text, Checkbox, Radio, Dropdown).
    - Map HTML input values back to the PDF fields using `PDFForm.getTextField().setText()`.

## 3. User Experience & Interface
- **Sidebar Editor**: List of all fields found for "Form Mode".
- **Overlay**: Direct on-PDF typing for interactive regions.

## 4. Verification & Success Criteria
- [ ] Captured data is correctly persisted into the PDF internal dictionary.
- [ ] Support for read-only fields and required field validation.
- [ ] Final document remains "Fillable" or can be "Flattened" as an option.
