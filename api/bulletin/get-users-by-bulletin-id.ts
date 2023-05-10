import dotenv from 'dotenv'
dotenv.config();

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE
if (!supabaseUrl || !serviceRole) {
    throw new Error(`Missing credentials`);
}
const supabase = createClient(supabaseUrl, serviceRole);

export default async function handler(req: any, res: any) {

    const { bulletinId } = req.body;
    const { data: joinedUsers, error } = await supabase.rpc('get_profiles_by_bulletin_id', {
        bulletinid: bulletinId,
    });
    if (error) {
        return { error: `Error getting joined users` }
    }

    return res.status(200).json(joinedUsers || []);

}