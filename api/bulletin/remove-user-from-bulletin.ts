import dotenv from 'dotenv'
dotenv.config();

import { createClient, User } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE
if (!supabaseUrl || !serviceRole) {
    throw new Error(`Missing credentials`);
}
const supabase = createClient(supabaseUrl, serviceRole);

export default async function handler(req: any, res: any) {

    const { userId, ownerId, bulletinId } = req.body;

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
        return res.status(403).json({ error: `Unauthorized to remove user from this bulletin.` });
    }

    // return if userId === bulletin.owner_id
    if (bulletin.owner_id === userId) {
        return res.status(400).json({ error: `Bulletin owner may not be removed` });
    }

    // delete joinedBulletin by id
    const { error: deleteError } = await supabase.rpc('remove_user_from_bulletin', {
        userid: userId,
        bulletinid: bulletinId
    });

    if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
    }

    // return 204
    return res.status(204).json();
}
