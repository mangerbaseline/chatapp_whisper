import { Suspense } from "react";
import GitHubCallbackClient from "./GitHubCallbackClient";

export default function Page() {
  return (
    <Suspense fallback={<p>Processing GitHub login…</p>}>
      <GitHubCallbackClient />
    </Suspense>
  );
}
