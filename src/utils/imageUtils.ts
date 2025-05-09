export const getSupabaseImageUrl = (imagePath: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mhhmucxengkrgkwpecee.supabase.co";
    return `${supabaseUrl}/storage/v1/object/public/img/${imagePath}`;
  };