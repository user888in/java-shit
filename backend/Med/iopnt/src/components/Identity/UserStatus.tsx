"use client";

import { useIdentity } from "@/context/IdentityContext";
import styles from "./UserStatus.module.css";

export function UserStatus() {
    const { user, refreshIdentity } = useIdentity();

    if (!user) return <div className={styles.loading}>Loading identity...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.avatar}>
                {user.name.charAt(0)}
            </div>
            <div className={styles.info}>
                <span className={styles.label}>Browsing as</span>
                <span className={styles.name}>{user.name}</span>
            </div>
            <button onClick={refreshIdentity} className={styles.reroll} title="New Identity">
                ↺
            </button>
        </div>
    );
}
