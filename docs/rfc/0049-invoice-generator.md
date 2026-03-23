# RFC 0049 - Invoice Generator (ZUGFeRD)

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Allow businesses to generate professional PDF invoices that include structured XML metadata (ZUGFeRD/XRechnung) for automated tax and accounting processing.

## 2. Technical Specification
- **Core Library**: `pdf-lib` + `xml-js`
- **Processing Logic**: 
    - Build a professional PDF invoice using a template.
    - Generate an XML file following the ZUGFeRD 2.0 schema based on form input.
    - Attach the XML as a file attachment inside the PDF using `/EmbeddedFiles`.

## 3. User Experience & Interface
- **Form**: Dedicated input for Line Items, Tax IDs, IBANs, and Customer details.
- **Branding**: Logo uploader and color palette selection.
- **Download**: "Compliant PDF Invoice" with embedded XML.

## 4. Verification & Success Criteria
- [ ] Generated PDF opens correctly in all standard viewers.
- [ ] Embedded XML passes ZUGFeRD validation tools.
- [ ] Calculation engine ensures total amounts and taxes are mathematically correct.
