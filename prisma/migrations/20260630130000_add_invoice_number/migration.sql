ALTER TABLE "Invoice"
ADD COLUMN "invoiceNumber" SERIAL NOT NULL;

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
