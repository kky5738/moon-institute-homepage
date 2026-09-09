import { notFound } from "next/navigation";
import { PendingButtonIntegrationTest } from "./pending-button-integration-test";

export default function PendingButtonTestPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return <PendingButtonIntegrationTest />;
}
