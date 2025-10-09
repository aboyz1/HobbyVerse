-- Seed data for Hobbyverse database

-- Insert sample badges
INSERT INTO badges (name, description, icon_url, criteria, points_required, rarity) VALUES
('First Post', 'Made your first post in a squad', 'https://example.com/badges/first-post.png', '{"posts_count": 1}', 0, 'common'),
('Helpful Member', 'Received 10 helpful votes', 'https://example.com/badges/helpful-member.png', '{"helpful_votes_received": 10}', 0, 'uncommon'),
('Project Starter', 'Created your first project', 'https://example.com/badges/project-starter.png', '{"projects_created": 1}', 0, 'common'),
('Challenge Champion', 'Completed 5 challenges', 'https://example.com/badges/challenge-champion.png', '{"challenges_completed": 5}', 100, 'rare'),
('Squad Leader', 'Created a squad with 50+ members', 'https://example.com/badges/squad-leader.png', '{"squad_members": 50}', 200, 'epic'),
('Knowledge Sharer', 'Made 100 helpful posts', 'https://example.com/badges/knowledge-sharer.png', '{"helpful_posts": 100}', 500, 'epic'),
('Community Hero', 'Reached 1000 total points', 'https://example.com/badges/community-hero.png', '{"total_points": 1000}', 1000, 'legendary'),
('Early Adopter', 'One of the first 100 users', 'https://example.com/badges/early-adopter.png', '{"user_id_rank": 100}', 0, 'rare'),
('Collaboration Master', 'Collaborated on 10 projects', 'https://example.com/badges/collaboration-master.png', '{"collaborations": 10}', 300, 'epic'),
('Mentor', 'Helped 20+ people in tutorials', 'https://example.com/badges/mentor.png', '{"tutorial_posts": 20}', 250, 'rare');

-- Insert sample users for testing (with hashed passwords)
-- Password for all test users is "password123"
INSERT INTO users (email, password_hash, display_name, avatar_url, bio, skills) VALUES
('alice@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewF5sSbUL.LF/ihe', 'Alice Johnson', 'https://randomuser.me/api/portraits/women/1.jpg', 'Passionate photographer and visual storyteller. Love capturing moments and teaching others.', ARRAY['photography', 'photo-editing', 'lightroom', 'composition']),

('bob@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewF5sSbUL.LF/ihe', 'Bob Smith', 'https://randomuser.me/api/portraits/men/1.jpg', 'Full-stack developer with a passion for clean code and user experience.', ARRAY['javascript', 'react', 'node.js', 'postgresql', 'ui-design']),

('carol@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewF5sSbUL.LF/ihe', 'Carol Davis', 'https://randomuser.me/api/portraits/women/2.jpg', 'Electronics enthusiast and maker. Building cool gadgets and teaching Arduino.', ARRAY['arduino', 'electronics', 'soldering', '3d-printing', 'iot']),

('david@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewF5sSbUL.LF/ihe', 'David Wilson', 'https://randomuser.me/api/portraits/men/2.jpg', 'Traditional artist exploring digital mediums. Love sketching and painting.', ARRAY['drawing', 'painting', 'digital-art', 'sketching', 'portraits']),

('emma@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewF5sSbUL.LF/ihe', 'Emma Brown', 'https://randomuser.me/api/portraits/women/3.jpg', 'Home chef and recipe developer. Sharing culinary adventures and techniques.', ARRAY['cooking', 'baking', 'recipe-development', 'food-photography', 'nutrition']);

-- Insert sample challenges
INSERT INTO challenges (title, description, tags, difficulty_level, points_reward, badge_reward, start_date, end_date, requirements, submission_guidelines, status, created_by) VALUES
('30-Day Photography Challenge', 'Take and share one photo every day for 30 days, showcasing different techniques and subjects.', ARRAY['photography', 'daily-challenge', 'creative'], 'beginner', 150, 'Challenge Champion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', ARRAY['Camera or smartphone', 'Basic photography knowledge'], 'Upload your daily photos with descriptions of techniques used.', 'active', (SELECT id FROM users WHERE email = 'alice@example.com')),

('Build a Web Portfolio', 'Create a personal portfolio website showcasing your projects and skills.', ARRAY['web-development', 'portfolio', 'html', 'css', 'javascript'], 'intermediate', 300, 'Project Starter', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '14 days', ARRAY['HTML/CSS knowledge', 'Basic JavaScript'], 'Submit GitHub repository link and live demo URL.', 'upcoming', (SELECT id FROM users WHERE email = 'bob@example.com')),

('Arduino LED Matrix Display', 'Build an 8x8 LED matrix display controlled by Arduino with custom animations.', ARRAY['arduino', 'electronics', 'programming', 'led'], 'advanced', 500, 'Innovation Award', CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '21 days', ARRAY['Arduino board', '8x8 LED matrix', 'Jumper wires', 'Breadboard'], 'Submit code, circuit diagram, and demo video.', 'upcoming', (SELECT id FROM users WHERE email = 'carol@example.com')),

('Sketching Fundamentals', 'Complete 10 different sketching exercises focusing on basic shapes, shading, and perspective.', ARRAY['drawing', 'sketching', 'art', 'fundamentals'], 'beginner', 100, 'Art Explorer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', ARRAY['Pencils', 'Sketchbook', 'Willingness to learn'], 'Upload photos of all 10 completed sketches with progress notes.', 'active', (SELECT id FROM users WHERE email = 'david@example.com')),

('Recipe Innovation Contest', 'Create and document a unique recipe using seasonal ingredients.', ARRAY['cooking', 'recipe', 'creative', 'food'], 'intermediate', 200, 'Chef Creator', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '10 days', ARRAY['Basic cooking skills', 'Kitchen access', 'Seasonal ingredients'], 'Submit recipe with ingredients, instructions, and final dish photos.', 'upcoming', (SELECT id FROM users WHERE email = 'emma@example.com'));

-- Insert sample squads
INSERT INTO squads (name, description, tags, privacy, created_by) VALUES
('Photography Enthusiasts', 'A community for photographers of all levels to share tips, techniques, and showcase their work.', ARRAY['photography', 'visual-arts', 'camera', 'editing'], 'public', (SELECT id FROM users WHERE email = 'alice@example.com')),

('Web Developers United', 'Full-stack and frontend developers sharing code, projects, and learning resources.', ARRAY['web-development', 'javascript', 'react', 'frontend', 'backend'], 'public', (SELECT id FROM users WHERE email = 'bob@example.com')),

('Arduino & Electronics', 'Makers and electronics hobbyists building cool projects with microcontrollers.', ARRAY['arduino', 'electronics', 'iot', 'makers', 'programming'], 'public', (SELECT id FROM users WHERE email = 'carol@example.com')),

('Digital Art Studio', 'Artists exploring digital mediums, sharing techniques and getting feedback.', ARRAY['digital-art', 'drawing', 'painting', 'illustration', 'design'], 'public', (SELECT id FROM users WHERE email = 'david@example.com')),

('Culinary Creators', 'Food enthusiasts sharing recipes, cooking tips, and culinary experiments.', ARRAY['cooking', 'recipes', 'food', 'baking', 'nutrition'], 'public', (SELECT id FROM users WHERE email = 'emma@example.com'));

-- Add users to squads
INSERT INTO squad_members (squad_id, user_id, role) VALUES
-- Photography Enthusiasts
((SELECT id FROM squads WHERE name = 'Photography Enthusiasts'), (SELECT id FROM users WHERE email = 'alice@example.com'), 'admin'),
((SELECT id FROM squads WHERE name = 'Photography Enthusiasts'), (SELECT id FROM users WHERE email = 'bob@example.com'), 'member'),
((SELECT id FROM squads WHERE name = 'Photography Enthusiasts'), (SELECT id FROM users WHERE email = 'david@example.com'), 'member'),

-- Web Developers United
((SELECT id FROM squads WHERE name = 'Web Developers United'), (SELECT id FROM users WHERE email = 'bob@example.com'), 'admin'),
((SELECT id FROM squads WHERE name = 'Web Developers United'), (SELECT id FROM users WHERE email = 'alice@example.com'), 'member'),
((SELECT id FROM squads WHERE name = 'Web Developers United'), (SELECT id FROM users WHERE email = 'carol@example.com'), 'member'),

-- Arduino & Electronics
((SELECT id FROM squads WHERE name = 'Arduino & Electronics'), (SELECT id FROM users WHERE email = 'carol@example.com'), 'admin'),
((SELECT id FROM squads WHERE name = 'Arduino & Electronics'), (SELECT id FROM users WHERE email = 'bob@example.com'), 'member'),

-- Digital Art Studio
((SELECT id FROM squads WHERE name = 'Digital Art Studio'), (SELECT id FROM users WHERE email = 'david@example.com'), 'admin'),
((SELECT id FROM squads WHERE name = 'Digital Art Studio'), (SELECT id FROM users WHERE email = 'alice@example.com'), 'member'),

-- Culinary Creators
((SELECT id FROM squads WHERE name = 'Culinary Creators'), (SELECT id FROM users WHERE email = 'emma@example.com'), 'admin'),
((SELECT id FROM squads WHERE name = 'Culinary Creators'), (SELECT id FROM users WHERE email = 'david@example.com'), 'member');

-- Insert sample threads
INSERT INTO squad_threads (squad_id, title, description, type, created_by) VALUES
((SELECT id FROM squads WHERE name = 'Photography Enthusiasts'), 'Weekly Photo Challenges', 'Share your photos for weekly themed challenges', 'projects', (SELECT id FROM users WHERE email = 'alice@example.com')),
((SELECT id FROM squads WHERE name = 'Photography Enthusiasts'), 'Camera & Lens Reviews', 'Reviews and recommendations for photography gear', 'tools', (SELECT id FROM users WHERE email = 'alice@example.com')),
((SELECT id FROM squads WHERE name = 'Web Developers United'), 'React Tips & Tricks', 'Share useful React patterns and solutions', 'tutorials', (SELECT id FROM users WHERE email = 'bob@example.com')),
((SELECT id FROM squads WHERE name = 'Arduino & Electronics'), 'Project Showcases', 'Show off your latest Arduino and electronics projects', 'projects', (SELECT id FROM users WHERE email = 'carol@example.com'));

-- Insert sample projects
INSERT INTO projects (title, description, tags, squad_id, created_by, status, difficulty_level, estimated_hours) VALUES
('Portrait Photography Series', 'A collection of portrait photos exploring different lighting techniques and emotions.', ARRAY['photography', 'portraits', 'lighting'], (SELECT id FROM squads WHERE name = 'Photography Enthusiasts'), (SELECT id FROM users WHERE email = 'alice@example.com'), 'in_progress', 'intermediate', 20),

('React Todo App with TypeScript', 'Building a full-featured todo application using React, TypeScript, and local storage.', ARRAY['react', 'typescript', 'frontend', 'javascript'], (SELECT id FROM squads WHERE name = 'Web Developers United'), (SELECT id FROM users WHERE email = 'bob@example.com'), 'completed', 'beginner', 8),

('Smart Home IoT Dashboard', 'Arduino-based dashboard for monitoring home sensors and controlling smart devices.', ARRAY['arduino', 'iot', 'sensors', 'dashboard'], (SELECT id FROM squads WHERE name = 'Arduino & Electronics'), (SELECT id FROM users WHERE email = 'carol@example.com'), 'in_progress', 'advanced', 40),

('Character Design Portfolio', 'Creating a series of original character designs for storytelling and animation.', ARRAY['character-design', 'illustration', 'digital-art'], (SELECT id FROM squads WHERE name = 'Digital Art Studio'), (SELECT id FROM users WHERE email = 'david@example.com'), 'planning', 'intermediate', 30);

-- Award some badges to users
INSERT INTO user_badges (user_id, badge_id) VALUES
((SELECT id FROM users WHERE email = 'alice@example.com'), (SELECT id FROM badges WHERE name = 'First Post')),
((SELECT id FROM users WHERE email = 'alice@example.com'), (SELECT id FROM badges WHERE name = 'Project Starter')),
((SELECT id FROM users WHERE email = 'bob@example.com'), (SELECT id FROM badges WHERE name = 'First Post')),
((SELECT id FROM users WHERE email = 'bob@example.com'), (SELECT id FROM badges WHERE name = 'Project Starter')),
((SELECT id FROM users WHERE email = 'carol@example.com'), (SELECT id FROM badges WHERE name = 'Project Starter')),
((SELECT id FROM users WHERE email = 'david@example.com'), (SELECT id FROM badges WHERE name = 'First Post'));

-- Add some points to users
UPDATE users SET total_points = 150 WHERE email = 'alice@example.com';
UPDATE users SET total_points = 120 WHERE email = 'bob@example.com';
UPDATE users SET total_points = 80 WHERE email = 'carol@example.com';
UPDATE users SET total_points = 60 WHERE email = 'david@example.com';
UPDATE users SET total_points = 40 WHERE email = 'emma@example.com';