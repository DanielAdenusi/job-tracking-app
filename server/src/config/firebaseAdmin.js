import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";

dotenv.config();

function normalizePrivateKey(privateKey) {
	return privateKey
		?.trim()
		.replace(/^"|"$/g, "")
		.replace(/\\n/g, "\n")
		.replace(/\r\n/g, "\n");
}

const firebaseAdminConfig = {
	credential: cert({
		projectId: process.env.FIREBASE_PROJECT_ID,
		clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
		privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
	}),
};

const app =
	getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];

export const adminAuth = getAuth(app);
