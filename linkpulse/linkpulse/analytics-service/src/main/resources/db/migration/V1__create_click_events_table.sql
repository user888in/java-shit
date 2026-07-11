CREATE TABLE click_events (
    id            BIGSERIAL PRIMARY KEY,
    short_code    VARCHAR(12) NOT NULL,
    url_id        BIGINT,
    clicked_at    TIMESTAMPTZ NOT NULL,
    referrer      TEXT,
    user_agent    TEXT,
    ip_address    VARCHAR(64),
    dedup_key     VARCHAR(128) NOT NULL,

    CONSTRAINT uq_dedup_key UNIQUE (dedup_key)
);

CREATE INDEX idx_click_events_short_code ON click_events (short_code);
CREATE INDEX idx_click_events_clicked_at ON click_events (clicked_at);
