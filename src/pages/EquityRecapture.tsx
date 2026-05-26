import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { EquityRecaptureCalculator } from "@/components/calculators/EquityRecapture";

export default function EquityRecapturePage() {
  return (
    <AuthenticatedLayout title="Equity Recapture Calculator">
      <EquityRecaptureCalculator />
    </AuthenticatedLayout>
  );
}
