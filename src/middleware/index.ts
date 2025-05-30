import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.js';

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
}); 