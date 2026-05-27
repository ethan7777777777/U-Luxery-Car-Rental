import { adminLoginAction } from "@/app/admin/actions";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const hasError = resolvedSearchParams.error === "1";

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <section className="panel" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h1>Admin Login</h1>
        <p className="muted">Enter the dashboard password configured in your environment.</p>
        {hasError && <div className="status error">Invalid password.</div>}
        <form action={adminLoginAction} className="form-grid">
          <label>
            Password
            <input type="password" name="password" required />
          </label>
          <button type="submit">Sign In</button>
        </form>
      </section>
    </div>
  );
}
