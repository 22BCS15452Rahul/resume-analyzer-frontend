import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBACAiQLk-VGpxDi3SW_GTMhr-S-rMM8HA",
  authDomain: "resume-analyzer-frontend-azure.vercel.app",
  projectId: "ai-resume-analyzer-65f15",
  storageBucket: "ai-resume-analyzer-65f15.firebasestorage.app",
  messagingSenderId: "969698111600",
  appId: "1:969698111600:web:6f39d0ce18a19bf50bc4b5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
