"use client";

import { useIdentity } from "@/context/IdentityContext";
import styles from "./Sidebar.module.css";

export function Sidebar() {
    const { user, refreshIdentity } = useIdentity();

    return (
        <aside className={styles.sidebar}>
            <div className={`${styles.card} card`}>
                <div className={styles.userSection}>
                    <div className={styles.avatar}>
                        {user?.name.charAt(0) || "?"}
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.label}>Browsing as</div>
                        <div className={styles.username}>{user?.name || "Loading..."}</div>
                    </div>
                    <button
                        onClick={refreshIdentity}
                        className={styles.refreshBtn}
                        title="New Identity"
                    >
                        ↻
                    </button>
                </div>
            </div>

            <div className={`${styles.card} ${styles.about} card`}>
                <h3 className={styles.cardTitle}>About Ephemeral</h3>
                <ul className={styles.features}>
                    <li>⏱️ Posts expire in 48 hours</li>
                    <li>💬 Chats delete after 12 hours</li>
                    <li>👤 Anonymous identities</li>
                    <li>📊 No likes or followers</li>
                    <li>🔥 Raw, unfiltered ideas</li>
                </ul>
            </div>

            <div className={`${styles.card} ${styles.rules} card`}>
                <h3 className={styles.cardTitle}>Guidelines</h3>
                <ul className={styles.rulesList}>
                    <li>Be respectful</li>
                    <li>No illegal content</li>
                    <li>No doxxing</li>
                    <li>Embrace ephemerality</li>
                </ul>
            </div>
        </aside>
    );
}
