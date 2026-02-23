// Supabase Edge Function: admin-manage-review
// Secure review management with Service Role Key (bypasses RLS)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface ReviewData {
  id?: string;
  title: string;
  game: string;
  slug: string;
  author: string;
  date: string;
  rating: number;
  excerpt: string;
  analysis: string;
  gameplay: string;
  graphics: string;
  story: string;
  verdict: string;
  pros: string[];
  cons: string[];
  coverImage: string;
  screenshots: string[];
  genre?: string;
  status: 'draft' | 'published';
}

interface RequestBody {
  action: 'create' | 'update';
  reviewData: ReviewData;
  adminToken: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Validates admin token against environment variable
 * Returns true if valid, false otherwise
 */
function validateAdminToken(token: string): boolean {
  const expectedHash = Deno.env.get('ADMIN_PASSWORD_HASH');
  
  if (!expectedHash) {
    console.error('ADMIN_PASSWORD_HASH not configured in environment');
    return false;
  }
  
  return token === expectedHash;
}

/**
 * Main Edge Function handler
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { action, reviewData, adminToken }: RequestBody = await req.json();

    // Validate admin token
    if (!adminToken || !validateAdminToken(adminToken)) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized: Invalid admin token',
          code: 'INVALID_TOKEN'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Service Role Key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }

    // Create Supabase client with Service Role Key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate required fields
    if (!reviewData.title || !reviewData.game || !reviewData.slug) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: title, game, or slug',
          code: 'VALIDATION_ERROR'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Execute action
    let result;
    let error;

    if (action === 'create') {
      // Insert new review
      const { data, error: insertError } = await supabaseAdmin
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();
      
      result = data;
      error = insertError;
    } else if (action === 'update') {
      // Update existing review
      if (!reviewData.id) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing review ID for update action',
            code: 'VALIDATION_ERROR'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data, error: updateError } = await supabaseAdmin
        .from('reviews')
        .update(reviewData)
        .eq('id', reviewData.id)
        .select()
        .single();
      
      result = data;
      error = updateError;
    } else {
      return new Response(
        JSON.stringify({ 
          error: `Invalid action: ${action}. Must be 'create' or 'update'`,
          code: 'INVALID_ACTION'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle database errors
    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: error.message,
          code: 'DATABASE_ERROR',
          details: error
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true,
        data: result,
        message: `Review ${action === 'create' ? 'created' : 'updated'} successfully`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    console.error('Edge Function error:', err);
    
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
