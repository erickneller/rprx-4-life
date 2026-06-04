import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State =
  | { kind: "loading" }
  | { kind: "valid"; email?: string }
  | { kind: "already" }
  | { kind: "invalid"; message: string }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid", message: "Missing unsubscribe token." });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: supabaseAnonKey } }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.valid) {
          setState({ kind: "valid", email: data.email });
        } else if (data?.already_unsubscribed) {
          setState({ kind: "already" });
        } else {
          setState({ kind: "invalid", message: data?.error ?? "This link is invalid or expired." });
        }
      } catch (e: any) {
        setState({ kind: "invalid", message: e?.message ?? "Unable to validate link." });
      }
    })();
  }, [token]);

  const onConfirm = async () => {
    setState({ kind: "submitting" });
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setState({ kind: "success" });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "Something went wrong." });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Unsubscribe</h1>

        {state.kind === "loading" && (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Validating your link…</p>
          </div>
        )}

        {state.kind === "valid" && (
          <>
            <p className="text-muted-foreground">
              {state.email
                ? `Unsubscribe ${state.email} from RPRx For Life emails?`
                : "Confirm you'd like to unsubscribe from RPRx For Life emails."}
            </p>
            <Button onClick={onConfirm} className="w-full">Confirm Unsubscribe</Button>
          </>
        )}

        {state.kind === "submitting" && (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Processing…</p>
          </div>
        )}

        {state.kind === "success" && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <p>You've been unsubscribed. We're sorry to see you go.</p>
          </div>
        )}

        {state.kind === "already" && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <p>This address is already unsubscribed.</p>
          </div>
        )}

        {(state.kind === "invalid" || state.kind === "error") && (
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p>{state.message}</p>
          </div>
        )}
      </Card>
    </main>
  );
}
