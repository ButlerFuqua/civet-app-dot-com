import dotenv from 'dotenv'
dotenv.config();

import mailgun from 'mailgun-js';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE
if (!supabaseUrl || !serviceRole) {
    throw new Error(`Missing credentials`);
}
const supabase = createClient(supabaseUrl, serviceRole);

export default async function handler(req: any, res: any) {

    const { FROM_EMAIL: fromEmail, SECRET_KEY: hashKey, MAILNGUN_API: mailgunApiKey, MAILGUN_DOMAIN: mailgunDomain } = process.env;
    if (!hashKey || !mailgunApiKey || !mailgunDomain) {
        return res.status(500).json({ error: `Missing credentials` });
    }

    const { email, bulletinId } = req.body;
    const errorMessage = `There was an error sending the email.`;

    // See if there is an account with the associated email, return error message if not
    const { data: user_profiles, error } = await supabase
        .from('user_profile')
        .select('email')
        .eq('email', email);

    if (error || !user_profiles) {
        return res.status(500).json({ error: error?.message || errorMessage });
    }

    if (!user_profiles.length) {
        return res.status(404).json({ error: `No account with email ${email}` });
    }
    const fetchedEmail = user_profiles[0].email;

    // Get bulletin by bulletinId
    const { data: bulletins, error: bulletinError } = await supabase
        .from('bulletin')
        .select('slug,title')
        .eq('id', bulletinId);

    if (bulletinError || !bulletins) {
        return res.status(500).json({ error: bulletinError?.message || errorMessage });
    }
    if (!bulletins.length) {
        return res.status(404).json({ error: `No bulletin found` });
    }

    // get access token
    // const { data } = await supabase.auth.resetPasswordForEmail(email, {
    //     redirectTo: 'https://example.com/update-password',
    // })
    const slug = bulletins[0].slug as string;
    const bulletinTitle = bulletins[0].title as string;
    const token = jwt.sign({ email, bulletinId, slug }, hashKey);

    // save token in db with bulletinId and email
    const { error: createTokenError } = await supabase
        .from('reset_token')
        .insert([
            {
                email: fetchedEmail,
                bulletin_id: bulletinId,
                token,
            },
        ]);

    if (createTokenError) {
        console.error(createTokenError);
        return res.status(500).json({ error: errorMessage });
    }

    // send email with access token link and bulletin link
    const domain = `${slug}.${process.env.PLATFORM_HOST}`;
    let redirectUrl = `https://${domain}?reset_token=${token}`;
    if (domain.includes('localhost:')) {
        redirectUrl = redirectUrl.replace('https://', 'http://');
    }
    const html = `
        <div style="padding:10px;">
            <p>Please follow the below link to reset your password at ${domain}</p>
            <p><a href="${redirectUrl}" target="_blank">${redirectUrl}</a></p>
        </div>
    `;
    const text = `Password reset link for ${domain} is : ${redirectUrl}`;
    try {
        const mg = mailgun({ apiKey: mailgunApiKey, domain: mailgunDomain });
        const data = {
            from: `${bulletinTitle} <${getFromEmailDomain()}>`,
            to: email,
            subject: `Password Reset`,
            html,
            text,
        };
        await mg.messages().send(data);

    } catch (error: any) {
        console.error('error', error);
        return res.status(500).json({ error: error.message || errorMessage });
    }

    return res.status(200).json({ message: `An email was sent to ${email}` });

}

function getFromEmailDomain(): string {
    const { PLATFORM_HOST: host, RESET_FROM_EMAIL } = process.env;
    if (RESET_FROM_EMAIL) {
        return RESET_FROM_EMAIL;
    }
    if (!host || host?.includes('localhost:3000')) {
        return 'no-reply@civetapp.com'
    }
    return `no-reply@${host}`;
}