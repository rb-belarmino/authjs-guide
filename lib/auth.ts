import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcrypt";

import { db as prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENTID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "email@email.com" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text", placeholder: "John Smith" },
      },
      async authorize(credentials, req): Promise<any> {
        console.log("Authorize method", credentials);

        if (!credentials?.email || !credentials.password)
          throw new Error("Credentials are required');");

        const user = await prisma.user.findUnique({
          where: {
            email: credentials?.email,
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("User not found by credentials");
        }

        const matchPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!matchPassword) throw new Error("Password wrong");

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
  },
};
