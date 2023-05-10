import { Context } from "@nuxt/types"

export default function (context: Context) {
    if (!process.client) {
        return;
    }
    // Add the userAgent property to the context
    // context.userAgent = process.server
    //     ? context.req.headers['user-agent']
    //     : navigator.userAgent


    const { hostname } = window.location;
    const subdomain = hostname.replace('.localhost', '');
}