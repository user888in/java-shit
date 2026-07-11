CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE api_keys (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id),
    key_prefix    VARCHAR(12) NOT NULL,
    key_hash      TEXT NOT NULL,
    label         VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at  TIMESTAMPTZ,
    revoked       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_api_keys_key_prefix ON api_keys (key_prefix) WHERE revoked = FALSE;
CREATE INDEX idx_api_keys_user_id ON api_keys (user_id);
