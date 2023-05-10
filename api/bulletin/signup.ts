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
    const password = bodyPassword.trim();

    console.log('email', email)
    console.log('password', password)

    // define user
    let user: User | null = null;

    // see if user exists in db
    try {
        const { data: user_profiles, error: userProfileError } = await supabase
            .from('user_profile')
            .select('*')
            .eq('email', email);

        if (userProfileError) {
            console.error(userProfileError)
            throw userProfileError;
        }


        const userProfile = (user_profiles || [])[0];
        if (userProfile) {
            // See if user has been banned
            const { data: banned_users, error: getBannedUserError } = await supabase
                .from('banned_user')
                .select('profile_id')
                .eq('profile_id', userProfile.id)
                .eq('bulletin_id', bulletinId);

            if (getBannedUserError) {
                return res.status(500).json({ message: getBannedUserError.message });
            }

            if (banned_users?.length) {
                return res.status(403).json({ message: `Unable to create account at this time.` });
            }
        }

        // If user exists, sign in user to make sure creds are correct
        // set user to existing
        if (user_profiles?.length) {
            const { error: signInError, data: signedInUserData } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                return res.status(400).json({ message: signInError.message });
            }
            if (!signedInUserData.user) {
                return res.status(500).json({ message: `Error getting new user.` });
            }
            user = signedInUserData.user;
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: `Error checking if user exists` });
    }

    // if not, sign in user and set to existing
    if (!user) {
        const { error: signUpError, data: newUserData } = await supabase.auth.signUp({
            email,
            password
        });

        if (signUpError) {
            console.error(signUpError)
            return res.status(500).json({ error: signUpError.message });
        }
        if (!newUserData.user) {
            return res.status(500).json({ message: `Error getting new user.` });
        }
        user = newUserData.user;
    }

    // see if user has already joined bulletin
    const { data: joined_bulletins, error: getJoinedBulletinsError } = await supabase
        .from('joined_bulletin')
        .select('*')
        .eq('profile_id', user.id);

    if (getJoinedBulletinsError) {
        console.error(getJoinedBulletinsError)
        return res.status(500).json({ error: getJoinedBulletinsError.message });
    }

    // if so, return user
    if (joined_bulletins?.filter(({ bulletin_id }) => bulletin_id === bulletinId).length) {
        return res.status(200).json({ ...user });
    }
    // if not, join bulletin then return user
    const { error: joinBulletinError } = await supabase
        .from('joined_bulletin')
        .insert([
            {
                profile_id: user.id,
                bulletin_id: bulletinId,
            },
        ]);

    if (joinBulletinError) {
        console.error(joinBulletinError)
        return res.status(500).json({ error: joinBulletinError.message });
    }

    // return user
    return res.status(200).json({ ...user });
}
