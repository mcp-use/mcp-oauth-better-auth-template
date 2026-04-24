import { ExternalLink, Globe, Lock, Shield } from "lucide-react";

import { Alert, AlertDescription } from "../components/ui/alert.js";
import { Button } from "../components/ui/button.js";
import { Layout } from "./layout.js";

interface ConsentProps {
  clientName: string;
  clientUri?: string | null;
  scopes: string[];
  consentScript: string;
}

export function Consent({
  clientName,
  clientUri,
  scopes,
  consentScript,
}: ConsentProps) {
  return (
    <Layout title={`Authorize ${clientName}`}>
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="mx-auto w-full max-w-[420px] space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-medium tracking-tight">
              Authorize {clientName}
            </h1>
            <p className="text-sm text-muted-foreground">
              This application is requesting access to your account
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
              <Globe className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-sm font-medium">Application</p>
                <p className="text-sm text-muted-foreground break-words">
                  {clientName}
                </p>
              </div>
            </div>

            {clientUri ? (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
                <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm font-medium">Website</p>
                  <p className="text-sm text-muted-foreground font-mono break-all">
                    {clientUri}
                  </p>
                </div>
              </div>
            ) : null}

            {scopes.length > 0 ? (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm font-medium">
                    Requested Permissions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {scopes.join(", ")}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Secure authorization:</strong> Only approve if you trust
              this application. You can revoke access at any time.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button data-consent="approve" size="lg" className="flex-1">
              Approve
            </Button>
            <Button
              data-consent="deny"
              size="lg"
              variant="outline"
              className="flex-1"
            >
              Deny
            </Button>
          </div>

          <p
            id="consent-error"
            className="min-h-[1.25rem] text-center text-sm text-destructive"
          />
        </div>
      </main>
      <script dangerouslySetInnerHTML={{ __html: consentScript }} />
    </Layout>
  );
}
