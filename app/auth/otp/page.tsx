import { OtpPage } from "@/components/auth-form";

export default function Page({ searchParams }: { searchParams: { email?: string } }) {
  return <OtpPage email={searchParams.email} />;
}
