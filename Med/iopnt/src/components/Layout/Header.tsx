"use client";

import styles from "./Header.module.css";

export function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.left}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}>⚡</span>
                        <span className={styles.logoText}>Ephemeral</span>
                    </div>
                </div>

                <div className={styles.center}>
                    <div className={styles.tagline}>
                        No history. No clout. Just ideas.
                    </div>
                </div>

                <div className={styles.right}>
                    {/* User status will go here */}
                </div>
            </div>
        </header>
    );
}
