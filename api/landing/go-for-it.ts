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

    const { email, password, bulletinTitle } = req.body;

    let user: User | null = null;

    // * See if user already exists
    try {
        const { data: user_profiles, error: userProfileError } = await supabase
            .from('user_profile')
            .select('*')
            .eq('email', email);

        if (userProfileError) {
            console.error(userProfileError)
            throw userProfileError;
        }

        // If user exists, sign in user to make sure creds are correct
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
        throw error;
    }

    // * Sign up new user
    if (!user) {
        const { error: signUpError, data: newUserData } = await supabase.auth.signUp({
            email,
            password
        });

        if (signUpError) {
            console.error(signUpError)
            throw signUpError;
        }
        if (!newUserData.user) {
            return res.status(500).json({ message: `Error getting new user.` });
        }
        user = newUserData.user;
    }

    // * Create new bulletin
    const slug = await getUniqueSlug(bulletinTitle);
    const { error: createBulletinError } = await supabase
        .from('bulletin')
        .insert([
            {
                title: bulletinTitle,
                slug,
                owner_id: user?.id,
                subdomain: `${slug}.${process.env.PLATFORM_HOST}`
            },
        ]);

    if (createBulletinError) {
        console.error(createBulletinError)
        throw createBulletinError;
    }

    // Get id from recently created bulletin
    const { data: bulletins, error: getBulletinError } = await supabase
        .from('bulletin')
        .select('id')
        .eq('slug', slug);

    if (getBulletinError) {
        console.error(getBulletinError)
        throw getBulletinError;
    }

    if (!bulletins || !bulletins.length) {
        return res.status(500).json({ message: `Error joining newly created bulletin` });
    }

    // * Create joined bulletin row
    const { error: joinBulletinError } = await supabase
        .from('joined_bulletin')
        .insert([
            {
                profile_id: user?.id,
                bulletin_id: bulletins[0].id,
            },
        ]);

    if (joinBulletinError) {
        console.error(joinBulletinError)
        throw joinBulletinError;
    }


    let link: string | null = null;
    const { PLATFORM_HOST: host } = process.env;
    if (host?.includes('localhost')) {
        link = `http://${slug}.${process.env.PLATFORM_HOST}`
    } else {
        link = `https://${slug}.${process.env.PLATFORM_HOST}`
    }

    // return new bulletin and access token
    return res.status(200).json({ link, bulletinTitle });

}

async function getUniqueSlug(title: string): Promise<string> {

    const slugRequest = title.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');

    // check if slug exists
    const { data: bulletins, error } = await supabase
        .from('bulletin')
        .select('*')
        .like('slug', `${slugRequest}%`)

    if (error) {
        console.error(error)
        throw error;
    }

    if (!bulletins?.length) {
        return slugRequest;
    }

    // if so, append something
    const slugs = bulletins.map(({ slug }) => slug);
    if (!slugs.includes(slugRequest)) {
        return slugRequest;
    }

    const nums = slugs.reduce((list, slug, idx) => {
        const ext = Number(slug.replace(slugRequest, ''));
        if (!Number.isNaN(ext)) {
            list.push(idx)
        }
        return list;
    }, []);

    return `${slugRequest}${Math.max(...nums) + 1}`
}