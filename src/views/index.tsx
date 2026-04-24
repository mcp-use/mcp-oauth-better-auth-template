import { renderPage } from "../render.js";
import { Consent } from "./consent.js";
import { SignIn } from "./sign-in.js";

export function renderSignInPage(opts: { signInScript: string }): string {
  return renderPage(<SignIn {...opts} />);
}

export function renderConsentPage(opts: {
  clientName: string;
  clientUri?: string | null;
  scopes: string[];
  consentScript: string;
}): string {
  return renderPage(<Consent {...opts} />);
}
