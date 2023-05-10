import dotenv from 'dotenv'
dotenv.config();

import { createClient } from '@supabase/supabase-js'

const {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE: serviceRole,
    SLUGS_BLACKLIST: blacklist,
} = process.env;

if (!supabaseUrl || !serviceRole) {
    throw new Error(`Missing credentials`);
}
const supabase = createClient(supabaseUrl, serviceRole);

export default async function handler(req: any, res: any) {

    const { bulletinId, slug: bulletinSlug, platformHost } = req.body;

    const slug = bulletinSlug.trim().toLowerCase();

    if (blacklist?.split(';').includes(slug)) {
        return res.status(401).json({ error: `${slug} is not available` });
    }

    // see if subdomain is available
    const { data: results, error: getSlugsError } = await supabase
        .from('bulletin')
        .select('id,slug')
        .like('slug', slug);


    if (getSlugsError) {
        return res.status(500).json({ error: getSlugsError.message });
    }

    if (results?.length && results.filter(({ id }) => id !== bulletinId).length) {
        return res.status(409).json({ error: `${slug} is not available` });
    }

    // return if it is the same
    const current = results?.find(({ id }) => id === bulletinId)
    if (current && current.slug === slug) {
        return res.status(409).json({ error: `No change requested` });
    }

    // Update subdomain
    const newSubdomain = `${slug}.${platformHost}`;

    const { error: updateSubError } = await supabase
        .from('bulletin')
        .update({
            subdomain: newSubdomain,
            slug,
        })
        .eq('id', bulletinId);

    if (updateSubError) {
        return res.status(500).json({ error: updateSubError.message });
    }

    return res.status(200).json({ bulletinId, newSubdomain, newSlug: slug });

}