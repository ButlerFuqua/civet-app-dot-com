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

    const { email: bodyEmail, password: bodyPassword, bulletinId } = req.body;
    const email = bodyEmail.trim().toLowerCase();
    const password = bodyPassword.trim().toLowerCase();

    const notJoinedErrorMessage = `No profile found on this bulletin with the email ${email}`;

    // See if user has a civet account, return if not
    const { data: user_profiles, error: userProfileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('email', email);

    if (userProfileError) {
        console.error(userProfileError)
        throw userProfileError;
    }

    // if not, return 404 not joined
    if (!user_profiles?.length) {
        return res.status(404).json({ error: notJoinedErrorMessage });
    }

    // See if user has joined the bulletin, and return if they have not
    const foundProfile = user_profiles[0];
    const { data: joined_bulletins, error: getJoinedBulletinsError } = await supabase
        .from('joined_bulletin')
        .select('*')
        .eq('profile_id', foundProfile.id);

    if (getJoinedBulletinsError) {
        console.error(getJoinedBulletinsError)
        return res.status(500).json({ message: getJoinedBulletinsError.message });
    }

    // if not, return 404 not joined
    if (!joined_bulletins?.filter(({ bulletin_id }) => bulletin_id === bulletinId).length) {
        return res.status(404).json({ error: notJoinedErrorMessage });
    }

    // sign in and return user & session
    const { error: signInError, data: { user, session } } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInError) {
        return res.status(500).json({ message: signInError.message });
    }
    if (!user) {
        return res.status(500).json({ message: `Error getting new user.` });
    }

    return res.status(200).json({ user, session });
}
