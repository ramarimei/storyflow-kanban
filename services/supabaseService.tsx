import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserStory } from '../types';

// Use Vite's import.meta.env for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if credentials exist to avoid crash
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("Supabase credentials missing. App running in local-only mode. Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.");
}

export const supabaseService = {
  async getStories(projectName: string): Promise<UserStory[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('project_name', projectName);
      
      if (error) {
        console.error('Error fetching stories:', error);
        return [];
      }
      return data as UserStory[];
    } catch (e) {
      console.error('Supabase request failed:', e);
      return [];
    }
  },

  async upsertStory(story: UserStory, projectName: string) {
    if (!supabase) {
      console.debug('Supabase not connected. Changes not synced to cloud.');
      return;
    }
    
    const { error } = await supabase
      .from('stories')
      .upsert({ ...story, project_name: projectName });
    
    if (error) console.error('Error saving story:', error);
  },

  async deleteStory(id: string) {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting story:', error);
  },

  subscribeToStories(projectName: string, onUpdate: () => void) {
    if (!supabase) return { unsubscribe: () => {} };
    
    const channel = supabase
      .channel(`public:stories:${projectName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories', filter: `project_name=eq.${projectName}` },
        () => onUpdate()
      )
      .subscribe();
      
    return {
      unsubscribe: () => supabase.removeChannel(channel)
    };
  }
};