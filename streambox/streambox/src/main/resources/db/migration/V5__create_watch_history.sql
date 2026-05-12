CREATE TABLE watch_history (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    movie_id     BIGINT        NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    progress_sec INT           NOT NULL DEFAULT 0,
    completed    BOOLEAN       NOT NULL DEFAULT FALSE,
    watched_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watch_history_user    ON watch_history(user_id);
CREATE INDEX idx_watch_history_movie   ON watch_history(movie_id);
CREATE UNIQUE INDEX idx_watch_history_user_movie ON watch_history(user_id, movie_id);

ALTER TABLE movies ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;