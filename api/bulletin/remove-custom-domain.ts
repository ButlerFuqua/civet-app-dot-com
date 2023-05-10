import dotenv from 'dotenv'
dotenv.config();

import { createClient, User } from '@supabase/supabase-js'
import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE
if (!supabaseUrl || !serviceRole) {
    throw new Error(`Missing credentials`);
}
const supabase = createClient(supabaseUrl, serviceRole);

export default async function handler(req: any, res: any) {

    const { userId, name: nameRequest } = req.body;
    const name = nameRequest.trim().toLowerCase();


    // Get domain from db, return if it doesn't exist
    const { data: custom_domains, error: getDomainsError } = await supabase
        .from('custom_domain')
        .select('*')
        .eq('name', name);

    if (getDomainsError) {
        return res.status(500).json({ error: getDomainsError.message });
    }

    if (!custom_domains?.length) {
        return res.status(400).json({ error: `Domain doesn't exist in database` });
    }

    // make sure user has permission to delete
    const domain = custom_domains[0];
    if (domain.owner_id !== userId) {
        return res.status(401).json({ error: `Unauthorized to delete domain.` });
    }

    // remove from db
    const { error: deleteFromDbError } = await supabase
        .from('custom_domain')
        .delete()
        .eq('name', name);

    if (deleteFromDbError) {
        return res.status(500).json({ error: deleteFromDbError.message });
    }

    // remove from vercel
    try {
        await axios.delete(
            `https://api.vercel.com/v6/domains/${name}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.DOMAIN_MANAGE_TOKEN}`,
                    "Content-Type": "application/json",
                }
            }
        );
    } catch (error: any) {
        console.error(JSON.stringify(error.response?.data, null, 4));
        return res.status(500).json({ error: `Error adding domain` });
    }

    // return 204
    return res.status(204).json();
}
