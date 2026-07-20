import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError } from "axios";

const baseURL =
  process.env.NEXTPUBLICBASEURL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000/api/v1";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        let response;
        try {
          response = await axios.post(`${baseURL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
        } catch (error) {
          if (error instanceof AxiosError) {
            const message =
              error.response?.data?.message ||
              error.response?.data?.error?.message ||
              "Invalid email or password.";
            throw new Error(message);
          }
          throw error;
        }
        const data = response.data?.data ?? response.data;
        const user = data?.user;
        if (!user || (user.role && user.role !== "admin")) {
          throw new Error("Only admin accounts can access this dashboard.");
        }
        return {
          id: user._id ?? user.id,
          name: user.fullName ?? user.name ?? "Admin",
          email: user.email,
          image: user.profileImage,
          role: user.role ?? "admin",
          _id: user._id ?? user.id,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & {
          accessToken?: string;
          refreshToken?: string;
          role?: string;
          _id?: string;
        };
        token.accessToken = authUser.accessToken;
        token.refreshToken = authUser.refreshToken;
        token.role = authUser.role;
        token._id = authUser._id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.role = token.role;
      session._id = token._id;
      session.user.role = token.role;
      session.user._id = token._id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
