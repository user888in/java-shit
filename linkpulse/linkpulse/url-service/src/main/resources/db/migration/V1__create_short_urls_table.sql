CREATE TABLE short_urls (
    id            BIGSERIAL PRIMARY KEY,
    short_code    VARCHAR(12) NOT NULL,
    long_url      TEXT NOT NULL,
    owner_id      BIGINT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    click_count   BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_short_code UNIQUE (short_code)
);

-- Fast lookup on the hot read path (redirect resolution fallback)
CREATE INDEX idx_short_urls_short_code ON short_urls (short_code) WHERE is_active = TRUE;

-- For "show my links" queries once auth is wired in
CREATE INDEX idx_short_urls_owner_id ON short_urls (owner_id);
