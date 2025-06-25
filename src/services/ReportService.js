// src/services/ReportService.js
import { supabase } from '../supabaseClient';

export const ReportService = {
  getRecentReports: async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching reports:', error.message);
      return [];
    }
    return data;
  },

  saveReport: async (report) => {
    const { location, description } = report; 
    const { data, error } = await supabase
      .from('reports')
      .insert([{ location, description }])
      .select();

    if (error) {
      console.error('Error saving report:', error.message);
      throw error;
    }
    return data[0];
  },

  confirmReport: async (reportId) => {
    const { error } = await supabase.rpc('increment_confirmations', { 
      report_id_to_update: reportId 
    });

    if (error) {
      console.error('Error confirming report:', error.message);
    }
  }
};