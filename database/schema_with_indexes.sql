-- Improved database schema with indexes for better performance and security

-- Create links table with proper indexes
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_clicks ON links(clicks DESC);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL, -- 'create', 'delete', 'update', 'login'
    resource_type TEXT NOT NULL, -- 'link', 'settings', 'auth'
    resource_id TEXT, -- slug, setting key, etc.
    user_ip TEXT,
    user_agent TEXT,
    details TEXT, -- JSON string with additional details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('fallback_url', ''),
    ('max_slug_length', '50'),
    ('allow_custom_slugs', 'true'),
    ('require_auth', 'true');

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_links_updated_at 
    AFTER UPDATE ON links
    FOR EACH ROW
BEGIN
    UPDATE links SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;