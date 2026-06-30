UPDATE "Invoice"
SET
  "taxAmount" = 0,
  "grandTotal" = GREATEST(0, "sessionTotal" + "cafeTotal" - "discountAmount");

UPDATE "CafeSettings"
SET "taxRate" = 0;
