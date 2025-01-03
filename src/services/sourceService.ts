import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Source = Database['public']['Tables']['sources']['Insert'];
type SourceUpdate = Database['public']['Tables']['sources']['Update'];

export class SourceService {
  async createSource(source: Source) {
    try {
      const { data, error } = await supabase
        .from('sources')
        .insert(source)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating source:', error);
      throw error;
    }
  }

  async updateSource(id: string, updates: SourceUpdate) {
    try {
      const { data, error } = await supabase
        .from('sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating source:', error);
      throw error;
    }
  }

  async getEnabledSources() {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('enabled', true)
        .order('last_scraped_at', { ascending: true, nullsFirst: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting enabled sources:', error);
      throw error;
    }
  }

  async updateLastScraped(id: string) {
    try {
      const { error } = await supabase
        .from('sources')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating last_scraped_at:', error);
      throw error;
    }
  }
}