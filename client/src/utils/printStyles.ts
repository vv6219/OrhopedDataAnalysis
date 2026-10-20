/**
 * printStyles.ts
 * Centralized print pagination styles for react-to-print and print templates.
 * Enforces strict UX and medical document printing standards:
 * - Prevents orphan headings (headers separated from section content or tables)
 * - Prevents table row truncation across page boundaries
 * - Ensures table headers repeat cleanly when tables span pages
 * - Keeps sections and signatures intact on the same page
 */

export const COMMON_PRINT_PAGE_STYLE = `
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  @media print {
    *, *:before, *:after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background: #FFFFFF !important;
    }
    .page-break {
      page-break-after: always !important;
      break-after: page !important;
    }
    /* 1. PREVENT ORPHAN HEADINGS (DECPOUPLING FROM CONTENT / TABLES) */
    h1, h2, h3, h4, h5, h6,
    .print-heading,
    .MuiTypography-h1,
    .MuiTypography-h2,
    .MuiTypography-h3,
    .MuiTypography-h4,
    .MuiTypography-h5,
    .MuiTypography-h6,
    .MuiTypography-subtitle1,
    .MuiTypography-subtitle2 {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    /* 2. PREVENT UNWANTED PAGE BREAKS INSIDE SECTIONS & CARDS */
    .print-section,
    .print-avoid-break,
    .no-page-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* 3. TABLE PRINT PAGINATION */
    table {
      page-break-inside: auto;
      break-inside: auto;
    }
    thead {
      display: table-header-group !important;
    }
    tfoot {
      display: table-footer-group !important;
    }
    tr, .MuiTableRow-root {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .MuiTableContainer-root {
      overflow: visible !important;
    }
  }
`;
