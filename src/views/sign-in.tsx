import { Button } from "../components/ui/button.js";
import { Icons } from "../components/ui/icons.js";
import { Layout } from "./layout.js";

interface SignInProps {
  /**
   * Client-side script body that handles a click on elements with
   * `data-provider="google"` or `data-provider="github"`. The script is
   * inlined into the page so the server can parameterize callback URLs
   * per template without a bundler.
   */
  signInScript: string;
}

export function SignIn({ signInScript }: SignInProps) {
  return (
    <Layout title="Sign In">
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="mx-auto w-full max-w-[400px] space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-medium tracking-tight">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground">
              Authorize the MCP client to access your account.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              data-provider="google"
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Icons.google className="h-4 w-4" />
              Continue with Google
            </Button>
            <Button
              data-provider="github"
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Icons.github className="h-4 w-4" />
              Continue with GitHub
            </Button>
          </div>

          <p
            id="signin-error"
            className="min-h-[1.25rem] text-center text-sm text-destructive"
          />
        </div>
      </main>
      <script dangerouslySetInnerHTML={{ __html: signInScript }} />
    </Layout>
  );
}
