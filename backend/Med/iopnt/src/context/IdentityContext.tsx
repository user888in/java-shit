"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { generateId, generateRandomName } from "@/lib/identity";

interface User {
    id: string;
    name: string;
}

interface IdentityContextType {
    user: User | null;
    refreshIdentity: () => void;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("ephemeral_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            createNewIdentity();
        }
    }, []);

    const createNewIdentity = () => {
        const newUser = {
            id: generateId(),
            name: generateRandomName(),
        };
        localStorage.setItem("ephemeral_user", JSON.stringify(newUser));
        setUser(newUser);
    };

    const refreshIdentity = () => {
        createNewIdentity();
    };

    return (
        <IdentityContext.Provider value={{ user, refreshIdentity }}>
            {children}
        </IdentityContext.Provider>
    );
}

export function useIdentity() {
    const context = useContext(IdentityContext);
    if (context === undefined) {
        throw new Error("useIdentity must be used within an IdentityProvider");
    }
    return context;
}
