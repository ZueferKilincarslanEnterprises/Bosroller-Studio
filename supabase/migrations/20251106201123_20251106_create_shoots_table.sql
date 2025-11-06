/*
  # Create shoots scheduling table

  1. New Tables
    - `shoots`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `project_title` (text, denormalized for display)
      - `date` (date, the shoot date)
      - `time` (time, shoot start time)
      - `location` (text, shoot location)
      - `notes` (text, additional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. New Join Table
    - `shoot_attendees`
      - `id` (uuid, primary key)
      - `shoot_id` (uuid, foreign key to shoots)
      - `team_member_id` (uuid, foreign key to team_members)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on `shoots` table
    - Enable RLS on `shoot_attendees` table
    - Users can view and manage shoots (initially permissive for single-team mode)

  4. Indexes
    - Index on `date` for efficient date queries
    - Index on `project_id` for project lookups
*/

CREATE TABLE IF NOT EXISTS shoots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_title text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  location text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shoot_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shoot_id uuid NOT NULL REFERENCES shoots(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shoots ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoot_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shoots are viewable by authenticated users"
  ON shoots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Shoots can be created by authenticated users"
  ON shoots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Shoots can be updated by authenticated users"
  ON shoots
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Shoots can be deleted by authenticated users"
  ON shoots
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Shoot attendees are viewable by authenticated users"
  ON shoot_attendees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Shoot attendees can be created by authenticated users"
  ON shoot_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Shoot attendees can be deleted by authenticated users"
  ON shoot_attendees
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS shoots_date_idx ON shoots(date);
CREATE INDEX IF NOT EXISTS shoots_project_id_idx ON shoots(project_id);
CREATE INDEX IF NOT EXISTS shoot_attendees_shoot_id_idx ON shoot_attendees(shoot_id);
