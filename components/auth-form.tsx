"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-fuchsia-600 via-violet-700 to-violet-950 px-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <Image
              src="/brand/tbz-favicon.png"
              alt="Talk BZ"
              width={86}
              height={53}
              priority
              className="mx-auto mb-5 h-auto w-[86px] rounded bg-violet-700 p-2"
            />
            <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </CardContent>
      </Card>
    </main>
  );
}

export function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function submit(formData: FormData) {
    setLoading(true);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Logged in successfully");
    router.push("/dashboard");
  }
  return (
    <AuthShell title="Admin Login" subtitle="Access the Talk BZ administration dashboard.">
      <form action={submit} className="space-y-4">
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Password" required />
        <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
      </form>
      <div className="mt-5 text-center text-sm"><Link className="font-semibold text-violet-600" href="/auth/forgot">Forgot password?</Link></div>
    </AuthShell>
  );
}

export function ForgotPage() {
  const router = useRouter();
  async function submit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    await authApi.forgotPassword(email);
    toast.success("OTP sent if the email exists");
    router.push(`/auth/otp?email=${encodeURIComponent(email)}`);
  }
  return <AuthShell title="Forgot Password" subtitle="Enter your email to receive an OTP."><form action={submit} className="space-y-4"><Input name="email" type="email" placeholder="Email" required /><Button className="w-full">Send OTP</Button></form><BackLogin /></AuthShell>;
}

export function OtpPage({ email }: { email?: string }) {
  const router = useRouter();
  async function submit(formData: FormData) {
    const payload = { email: String(formData.get("email")), otp: String(formData.get("otp")) };
    const res = await authApi.verifyResetOtp(payload);
    const token = res?.data?.resetToken ?? res?.resetToken;
    toast.success("OTP verified");
    router.push(`/auth/reset-password?token=${encodeURIComponent(token ?? "")}`);
  }
  return <AuthShell title="Verify OTP" subtitle="Enter the code sent to your email."><form action={submit} className="space-y-4"><Input name="email" type="email" defaultValue={email} placeholder="Email" required /><Input name="otp" placeholder="OTP" required /><Button className="w-full">Verify OTP</Button></form><BackLogin /></AuthShell>;
}

export function ResetPasswordPage({ token }: { token?: string }) {
  const router = useRouter();
  async function submit(formData: FormData) {
    await authApi.resetPassword({ resetToken: String(formData.get("token")), newPassword: String(formData.get("password")), confirmPassword: String(formData.get("confirmPassword")) });
    toast.success("Password reset successful");
    router.push("/auth/login");
  }
  return <AuthShell title="Reset Password" subtitle="Create a new secure password."><form action={submit} className="space-y-4"><Input name="token" defaultValue={token} placeholder="Reset token" required /><Input name="password" type="password" placeholder="New password" required /><Input name="confirmPassword" type="password" placeholder="Confirm password" required /><Button className="w-full">Reset Password</Button></form><BackLogin /></AuthShell>;
}

export function ChangePasswordPage() {
  async function submit(formData: FormData) {
    await authApi.changePassword({ currentPassword: String(formData.get("currentPassword")), newPassword: String(formData.get("password")), confirmPassword: String(formData.get("confirmPassword")) });
    toast.success("Password changed");
  }
  return <AuthShell title="Change Password" subtitle="Update your current password."><form action={submit} className="space-y-4"><Input name="currentPassword" type="password" placeholder="Current password" required /><Input name="password" type="password" placeholder="New password" required /><Input name="confirmPassword" type="password" placeholder="Confirm password" required /><Button className="w-full">Change Password</Button></form><BackLogin /></AuthShell>;
}

function BackLogin() {
  return <div className="mt-5 text-center text-sm"><Link className="font-semibold text-violet-600" href="/auth/login">Back to login</Link></div>;
}
