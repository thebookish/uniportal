-- Add metadata column to team_invitations for storing name and permissions
ALTER TABLE public.team_invitations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Make auth_id nullable in users table for pending invitations flow
ALTER TABLE public.users ALTER COLUMN auth_id DROP NOT NULL;

-- Drop the foreign key constraint temporarily
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_id_fkey;

-- Re-add constraint with ON DELETE SET NULL to handle auth user deletion
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_fkey 
  FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_invitation_id UUID,
  p_auth_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  SELECT * INTO v_invitation 
  FROM public.team_invitations 
  WHERE id = p_invitation_id AND status = 'pending';
  
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  IF v_invitation.expires_at < NOW() THEN
    UPDATE public.team_invitations SET status = 'expired' WHERE id = p_invitation_id;
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;
  
  INSERT INTO public.users (
    auth_id,
    name,
    email,
    role,
    university_id,
    permissions
  ) VALUES (
    p_auth_id,
    COALESCE((v_invitation.metadata->>'name')::TEXT, 'Team Member'),
    v_invitation.email,
    v_invitation.role,
    v_invitation.university_id,
    COALESCE(v_invitation.metadata->'permissions', '{}'::JSONB)
  )
  RETURNING id INTO v_user_id;
  
  UPDATE public.team_invitations 
  SET status = 'accepted' 
  WHERE id = p_invitation_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'user_id', v_user_id,
    'university_id', v_invitation.university_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
