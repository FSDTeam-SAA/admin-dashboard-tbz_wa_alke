import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized: ({ token }) => token?.role === "admin",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/instructors/:path*",
    "/submissions/:path*",
    "/groups/:path*",
    "/live-classes/:path*",
    "/payments/:path*",
    "/wallet/:path*",
    "/referrals/:path*",
    "/content/:path*",
    "/settings/:path*",
  ],
};
