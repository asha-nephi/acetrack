import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK (server-side only)
function getAdminDb() {
    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
    return getFirestore();
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@acefacades.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                try {
                    const db = getAdminDb();
                    const snapshot = await db.collection('users')
                        .where('email', '==', credentials.email)
                        .limit(1)
                        .get();

                    if (snapshot.empty) {
                        throw new Error("Invalid credentials");
                    }

                    const userDoc = snapshot.docs[0];
                    const user = { id: userDoc.id, ...userDoc.data() } as any;

                    if (!user.password) {
                        throw new Error("Invalid credentials");
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isValid) {
                        throw new Error("Invalid credentials");
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch (error: any) {
                    if (error.message === "Invalid credentials") throw error;
                    throw new Error("Authentication failed");
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET || "ac3_f4c4d3s_s3cr3t_k3y_for_mVP",
};
