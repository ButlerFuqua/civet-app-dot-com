import dotenv from 'dotenv'
dotenv.config();

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
if (!supabaseUrl || !supabaseKey) {
    throw new Error(`Missing credentials`);
}
const supabase = createClient(supabaseUrl, supabaseKey)


export default async function handler(req: any, res: any) {

    const { bulletinSlug: slug } = req.body;
    const bulletinSlug = slug.trim().toLowerCase();

    const { data: bulletin, error } = await supabase
        .from('bulletin')
        .select("*")
        // .single()
        .eq('slug', bulletinSlug)
        .single();

    if (error) {
        res.status(500).json(error);
    }

    return res.status(200).json({ ...bulletin });

}