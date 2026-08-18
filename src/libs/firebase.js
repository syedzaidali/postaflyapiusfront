import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA8Rj70lLIzVYSRVvdsiLEmc06wKmjNd2c",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "postafly-2b7e1.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://postafly-2b7e1-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "postafly-2b7e1",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "postafly-2b7e1.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "57313044122",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:57313044122:web:40719dcd88d6e358006123"
};


const firebaseApp = initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);

export { firebaseApp, database };