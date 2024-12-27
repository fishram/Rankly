import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../../../../../lib/prisma";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth/next";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
      username?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
    username?: string | null;
  }
}

type UserWithIsAdmin = {
  id: string;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
  username?: string | null;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as UserWithIsAdmin).id;
        token.isAdmin = (user as UserWithIsAdmin).isAdmin;
        token.username = (user as UserWithIsAdmin).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.username = token.username;
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      await prisma.player.create({
        data: {
          name: user.name || user.email?.split('@')[0] || 'New Player',
          userId: user.id,
        }
      });
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 