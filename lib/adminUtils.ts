import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';

/**
 * Check if the current user is an admin
 * @param user - The current authenticated user
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export const isAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      // Handle expected errors silently
      // PGRST116 = no rows returned (user has no role yet)
      // 42P01 = relation does not exist (table not created yet)
      // 42501 = permission denied (RLS blocking, but user might not be admin)
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // These are expected during initial setup
        return false;
      }
      
      // For other errors, log but don't show warning to user
      if (error.code !== '42501') {
        console.debug('Admin role check:', error.code, error.message);
      }
      
      return false;
    }
    
    return data?.role === 'admin';
  } catch (error: any) {
    // Only log unexpected errors
    if (error?.code !== 'PGRST116' && error?.code !== '42P01') {
      console.debug('Error in isAdmin check:', error?.message || error);
    }
    return false;
  }
};

/**
 * Set a user as admin (only callable by existing admins or during initial setup)
 * @param userId - The user ID to set as admin
 * @returns Promise<boolean> - True if successful
 */
export const setUserAsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error setting user as admin:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in setUserAsAdmin:', error);
    return false;
  }
};

/**
 * Get all users with their roles (admin only)
 * @returns Promise<Array<{user_id: string, role: string, email?: string}>>
 */
export const getAllUserRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllUserRoles:', error);
    return [];
  }
};

