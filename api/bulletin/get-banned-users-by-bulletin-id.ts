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

    const { bulletinId, ownerId } = req.body;

    // Make sure ownerId matches bulletin.owner_id
    // get bulletin
    const { data: bulletins, error: getBulletinsError } = await supabase
        .from('bulletin')
        .select("*")
        .eq('id', bulletinId);

    if (getBulletinsError) {
        return res.status(500).json({ error: getBulletinsError.message });
    }

    if (!bulletins?.length) {
        return res.status(404).json({ error: `Could not find bulletin.` });
    }

    const bulletin = bulletins[0];
    // return if ownerId !== bulletin.owner_id
    if (bulletin.owner_id !== ownerId) {
        return res.status(403).json({ error: `Unauthorized.` });
    }

    const { data: joinedUsers, error } = await supabase.rpc('get_banned_profiles_by_bulletin_id', {
        bulletinid: bulletinId,
    });
    if (error) {
        return { error: `Error getting joined users` }
    }

    return res.status(200).json(joinedUsers || []);

}