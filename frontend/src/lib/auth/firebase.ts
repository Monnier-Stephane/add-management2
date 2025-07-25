import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCvnyzRjxmecjUzmVOjFYiZPztODx4FRqA",
    authDomain: "add-students-2025.firebaseapp.com",
    projectId: "add-students-2025",
    storageBucket: "add-students-2025.firebasestorage.app",
    messagingSenderId: "597550207637",
    appId: "1:597550207637:web:4591e6e97e8ce9280a019c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 