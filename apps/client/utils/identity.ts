// src/utils/identity.ts
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

export const getUserId = () => {
    if (typeof window === "undefined") return ""; // Server-side safety

    let id = localStorage.getItem("chess_user_id");
    if (!id) {
        id = uuidv4();
        localStorage.setItem("chess_user_id", id);
    }
    return id;
};