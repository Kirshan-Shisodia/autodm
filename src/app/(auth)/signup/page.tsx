import Link from "next/link";

import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Plans the landing page can pre-select via /signup?plan=… (spec §20c). Anything
// else is ignored so a junk query param can't seed bad account metadata.
const VALID_PLANS = ["free", "pro"] as const;
type Plan = (typeof VALID_PLANS)[number];

function normalizePlan(raw: string | undefined): Plan | undefined {
  return VALID_PLANS.includes(raw as Plan) ? (raw as Plan) : undefined;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string }>;
}) {
  const { error, plan: rawPlan } = await searchParams;
  const plan = normalizePlan(rawPlan);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            {plan === "pro"
              ? "Start your Pro plan — automate Instagram DMs at scale."
              : "Start automating Instagram DMs."}
          </CardDescription>
        </CardHeader>
        <form action={signup}>
          <CardContent className="space-y-4">
            {/* Carries the plan chosen on the landing page into the server action
                (spec §20c: don't lose purchase intent between pages). */}
            {plan && <input type="hidden" name="plan" value={plan} />}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="mt-4 flex flex-col gap-3">
            <Button type="submit" className="w-full">
              Sign up
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
