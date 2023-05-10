import dotenv from 'dotenv'
dotenv.config();

import mailgun from 'mailgun-js';
import { createClient, User } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE
if (!supabaseUrl || !serviceRole) {
    throw new Error(`Missing credentials`);
}
const supabase = createClient(supabaseUrl, serviceRole);

export default async function handler(req: any, res: any) {

    const { MAILNGUN_API: mailgunApiKey, MAILGUN_DOMAIN: mailgunDomain } = process.env;
    if (!mailgunApiKey || !mailgunDomain) {
        return res.status(500).json({ error: `Missing credentials` });
    }

    const { userId, email, bulletinId } = req.body;

    // get bulletin
    let { data: bulletins, error: getBulletinsError } = await supabase
        .from('bulletin')
        .select("*")
        .eq('id', bulletinId);

    if (getBulletinsError) {
        return res.status(500).json({ error: getBulletinsError.message });
    }

    if (!bulletins?.length) {
        return res.status(404).json({ error: `Could not find bulletin to delete` });
    }

    const bulletin = bulletins[0];

    // return if userId !== bulletin.owner_id
    if (bulletin.owner_id !== userId) {
        return res.status(403).json({ error: `Unauthorized to delete this bulletin.` });
    }

    // delete bulletin by id
    const { error: deleteError } = await supabase
        .from('bulletin')
        .delete()
        .eq('id', bulletinId);

    if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
    }

    // send email to bulletin owner
    let createUrl = `https://${process.env.PLATFORM_HOST}`;
    if (createUrl.includes('localhost:')) {
        createUrl = createUrl.replace('https://', 'http://');
    }
    const html = `
        <div style="padding:10px;">
            <p>We want to [sadly] confirm that you have deleted the following bulletin:</p>
            <ul>
                <li>Title: ${bulletin.title}</li>
                <li>Slug: ${bulletin.slug}</li>
                <li>Subdomain: ${bulletin.subdomain}</li>
            </ul>
            <br/>
            <p><a href="${createUrl}" target="_blank">Create a new bulletin!</a></p>
        </div>
    `;
    const text = `Confirmation that the bulletin with the subdomain of ${bulletin.subdomain} has been deleted. Title: ${bulletin.title}.`;
    try {
        const mg = mailgun({ apiKey: mailgunApiKey, domain: mailgunDomain });
        const data = {
            from: `Civet <no-reply@civetapp.com>`,
            to: email,
            subject: `Bulletin deleted`,
            html,
            text,
        };
        await mg.messages().send(data);
    } catch (error: any) {
        console.error('error', error);
    }


    // return 204
    return res.status(200).json();
}
