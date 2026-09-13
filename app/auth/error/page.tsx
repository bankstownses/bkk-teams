import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-6 text-center">
        <div className="font-heading text-lg font-bold text-danger">Sign-in problem</div>
        <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
          Something went wrong confirming your account. The link may have expired — try signing in again or request a
          new confirmation email.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-primary-foreground"
        >
          BACK TO SIGN IN
        </Link>
      </div>
    </div>
  )
}
