-- Migration to add repost functionality
-- This migration adds the reposts table and updates the general_posts table with repost_count

-- Create reposts table
CREATE TABLE reposts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('general_post', 'squad_post', 'project', 'challenge')),
    post_id UUID NOT NULL,
    original_post_id UUID, -- For tracking the original post in a repost chain
    content TEXT, -- Optional comment when reposting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_type, post_id) -- Prevent duplicate reposts by same user
);

-- Add repost_count column to general_posts table
ALTER TABLE general_posts ADD COLUMN repost_count INTEGER DEFAULT 0;

-- Add repost_count column to squad_posts table
ALTER TABLE squad_posts ADD COLUMN repost_count INTEGER DEFAULT 0;

-- Add repost_count column to projects table
ALTER TABLE projects ADD COLUMN repost_count INTEGER DEFAULT 0;

-- Add repost_count column to challenges table
ALTER TABLE challenges ADD COLUMN repost_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_post_type_post_id ON reposts(post_type, post_id);
CREATE INDEX idx_reposts_created_at ON reposts(created_at);
CREATE INDEX idx_general_posts_repost_count ON general_posts(repost_count);
CREATE INDEX idx_squad_posts_repost_count ON squad_posts(repost_count);
CREATE INDEX idx_projects_repost_count ON projects(repost_count);
CREATE INDEX idx_challenges_repost_count ON challenges(repost_count);

-- Create function to update repost count
CREATE OR REPLACE FUNCTION update_repost_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment repost count based on post type
        IF NEW.post_type = 'general_post' THEN
            UPDATE general_posts SET repost_count = repost_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.post_type = 'squad_post' THEN
            UPDATE squad_posts SET repost_count = repost_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.post_type = 'project' THEN
            UPDATE projects SET repost_count = repost_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.post_type = 'challenge' THEN
            UPDATE challenges SET repost_count = repost_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement repost count based on post type
        IF OLD.post_type = 'general_post' THEN
            UPDATE general_posts SET repost_count = repost_count - 1 WHERE id = OLD.post_id;
        ELSIF OLD.post_type = 'squad_post' THEN
            UPDATE squad_posts SET repost_count = repost_count - 1 WHERE id = OLD.post_id;
        ELSIF OLD.post_type = 'project' THEN
            UPDATE projects SET repost_count = repost_count - 1 WHERE id = OLD.post_id;
        ELSIF OLD.post_type = 'challenge' THEN
            UPDATE challenges SET repost_count = repost_count - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update repost counts
CREATE TRIGGER repost_count_trigger
    AFTER INSERT OR DELETE ON reposts
    FOR EACH ROW EXECUTE FUNCTION update_repost_count();