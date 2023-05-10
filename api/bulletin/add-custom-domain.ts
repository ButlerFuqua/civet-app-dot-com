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

    const { userId, bulletinId, name } = req.body;

    const customName = name.trim().toLowerCase();

    /**
     * Check domain availability in vercel
     * 
     * Commenting this out as it checks if the domain is available for purchasing, but the user may have already purchased the domain.
     * Leaving it here because I'm lazy and may want this later for allowing the user to register/check for domains.
     */
    // try {
    //     const { data: { available } } = await axios.get(
    //         `https://api.vercel.com/v4/domains/status?name=${name}`,
    //         {
    //             headers: {
    //                 Authorization: `Bearer ${process.env.DOMAIN_MANAGE_TOKEN}`,
    //                 "Content-Type": "application/json",
    //             }
    //         }
    //     );
    //     if (!available) {
    //         return res.status(409).json({ error: `Domain is not available` });
    //     }
    // } catch (error: any) {
    //     console.error(JSON.stringify(error.response.data, null, 4))
    // }

    // See if domain exists in db
    const { data: custom_domains, error: getDomainsError } = await supabase
        .from('custom_domain')
        .select('*')
        .eq('name', customName);

    if (getDomainsError) {
        return res.status(500).json({ error: getDomainsError.message });
    }

    if (custom_domains?.length) {
        return res.status(409).json({ error: `Domain already exists in database` });
    }

    // Add new domain in db
    const { error: addNewDomainError } = await supabase
        .from('custom_domain')
        .insert([{
            name: customName,
            bulletin_id: bulletinId,
            owner_id: userId,
        }]);

    if (addNewDomainError) {
        return res.status(500).json({ error: addNewDomainError.message });
    }

    // Add domain to vercel
    try {
        await axios.post(
            `https://api.vercel.com/v9/projects/${process.env.PROJECT_ID_VERCEL}/domains`,
            {
                name: customName,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.DOMAIN_MANAGE_TOKEN}`,
                    "Content-Type": "application/json",
                }
            }
        );
    } catch (error: any) {
        console.error(JSON.stringify(error.response?.data, null, 4));
        try {
            await supabase
                .from('custom_domain')
                .delete()
                .eq('name', customName);
        } catch (error) {
            console.error(`Error deleting domain from db after`)
            console.error(error)
        }
        return res.status(500).json({ error: `Error adding domain` });
    }

    // todo Add www.redirect

    // return 201
    return res.status(201).json();
}
