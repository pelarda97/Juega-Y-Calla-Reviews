-- Add status field to reviews table for draft/published management
-- This allows admins to save work in progress without publishing

-- Add status column (default to 'published' for existing reviews)
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
CHECK (status IN ('draft', 'published'));

-- Create index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Update RLS policies to hide drafts from public
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;

-- Recreate SELECT policy to only show published reviews to public
CREATE POLICY "Published reviews are viewable by everyone"
ON public.reviews
FOR SELECT
USING (status = 'published');

-- Allow service role to see all reviews (including drafts)
CREATE POLICY "Service role can view all reviews"
ON public.reviews
FOR SELECT
TO service_role
USING (true);

-- Comment for documentation
COMMENT ON COLUMN public.reviews.status IS 'Review publication status: draft (not visible to public) or published (visible to everyone)';
