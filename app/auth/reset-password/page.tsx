import { ResetPasswordPage } from "@/components/auth-form";

export default function Page({ searchParams }: { searchParams: { token?: string } }) {
  return <ResetPasswordPage token={searchParams.token} />;
}
