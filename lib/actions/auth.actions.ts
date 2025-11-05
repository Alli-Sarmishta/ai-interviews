'use server';

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import type { Firestore } from "firebase-admin/firestore";

const ONE_WEEK = 60 * 60 * 24 * 7;

// ✅ Tell TypeScript this is Firebase Admin Firestore
const adminDb = db as Firestore;

export async function signUp(params: SignUpParams) {
    const { uid, name, email } = params;

    try {
        const userRecord = await adminDb.collection("users").doc(uid).get(); // ✅ fixed

        if (userRecord.exists) {
            return {
                success: false,
                message: "User already exists. Please sign in instead."
            };
        }

        await adminDb.collection("users").doc(uid).set({ name, email }); // ✅ fixed

        return {
            success: true,
            message: "Account created successfully. Please sign in.",
        };
    } catch (e: any) {
        console.error("Error creating user", e);

        if (e.code === "auth/email-already-exists") {
            return {
                success: false,
                message: "This email is already in use.",
            };
        }

        return {
            success: false,
            message: "Failed to create an account",
        };
    }
}

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        const userRecord = await auth.getUserByEmail(email);
        if (!userRecord) {
            return {
                success: false,
                message: "User does not exist. Please create an account instead.",
            };
        }

        await setSessionCookie(idToken);

        return {
            success: true,
            message: "Logged in successfully.",
        };
    } catch (e) {
        console.error(e);
        return {
            success: false,
            message: "Failed to log in",
        };
    }
}

export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies();

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: ONE_WEEK * 1000,
    });

    cookieStore.set("session", sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: ONE_WEEK,
        path: "/",
        sameSite: "lax",
    });
}