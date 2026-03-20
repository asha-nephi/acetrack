import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

export async function POST(req: Request) {
    try {
        const { name, email, password, role, permissions = [] } = await req.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const db = getAdminDb();

        // Check if user already exists
        const existing = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!existing.empty) {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const docRef = await db.collection('users').add({
            name,
            email,
            password: hashedPassword,
            role,
            permissions,
            createdAt: new Date().toISOString(),
            status: 'active',
            isActive: true,
        });

        return NextResponse.json({ user: { id: docRef.id, name, email, role, permissions }, message: 'User created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
    }
}
