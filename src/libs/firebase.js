import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyA8Rj70lLIzVYSRVvdsiLEmc06wKmjNd2c",
    authDomain: "postafly-2b7e1.firebaseapp.com",
    databaseURL: "https://postafly-2b7e1-default-rtdb.firebaseio.com",
    projectId: "postafly-2b7e1",
    storageBucket: "postafly-2b7e1.firebasestorage.app",
    messagingSenderId: "57313044122",
    appId: "1:57313044122:web:40719dcd88d6e358006123"
};


const firebaseApp = initializeApp(firebaseConfig);

const database = getDatabase(firebaseApp);

export { firebaseApp, database };