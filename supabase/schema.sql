-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view profiles of community members"
  ON profiles FOR SELECT
  USING (
    -- Allow viewing own profile
    auth.uid() = id
    OR
    -- Allow viewing profiles of users in the same community
    EXISTS (
      SELECT 1 FROM community_members cm1
      WHERE cm1.user_id = profiles.id
      AND EXISTS (
        SELECT 1 FROM community_members cm2
        WHERE cm2.user_id = auth.uid()
        AND cm2.community_id = cm1.community_id
      )
    )
    OR
    -- Allow viewing profiles of users in communities the viewer owns
    EXISTS (
      SELECT 1 FROM community_members cm
      JOIN communities c ON c.id = cm.community_id
      WHERE cm.user_id = profiles.id
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  banner_url TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'education', 'technology', 'business', 'health', 'creative', 'sports', 'gaming', 'lifestyle', 'other')),
  is_public BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  price INTEGER,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  custom_module_names JSONB DEFAULT '{}'::jsonb,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Users can view public communities"
  ON communities FOR SELECT
  USING (
    is_public = true
    OR auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own communities"
  ON communities FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own communities"
  ON communities FOR DELETE
  USING (auth.uid() = owner_id);

-- Community modules table
CREATE TABLE community_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN ('chat', 'notes', 'tasks', 'zoom')),
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, module_type)
);

ALTER TABLE community_modules ENABLE ROW LEVEL SECURITY;

-- Community modules policies
CREATE POLICY "Members can view modules of their communities"
  ON community_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_modules.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = community_modules.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create modules for their communities"
  ON community_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_modules.community_id
      AND communities.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update modules of their communities"
  ON community_modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_modules.community_id
      AND communities.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete modules of their communities"
  ON community_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_modules.community_id
      AND communities.owner_id = auth.uid()
    )
  );

-- Community members table
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of communities they belong to"
  ON community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id
      AND (
        communities.owner_id = auth.uid()
        OR communities.is_public = true
        OR EXISTS (
          SELECT 1 FROM community_members cm
          WHERE cm.community_id = communities.id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join public communities"
  ON community_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id
      AND communities.is_public = true
    )
  );

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (
    user_id = auth.uid()
    AND role = 'member'
  );

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view notes in their communities"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = notes.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = notes.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can create notes in their communities"
  ON notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = notes.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = notes.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (user_id = auth.uid());

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tasks in their communities"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = tasks.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = tasks.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can create tasks in their communities"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = tasks.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = tasks.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (user_id = auth.uid());

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages in their communities"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = chat_messages.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = chat_messages.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can create messages in their communities"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = chat_messages.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = chat_messages.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_modules_updated_at
  BEFORE UPDATE ON community_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to increment member count
CREATE OR REPLACE FUNCTION increment_member_count(community_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities
  SET member_count = member_count + 1
  WHERE id = community_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement member count
CREATE OR REPLACE FUNCTION decrement_member_count(community_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE id = community_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
