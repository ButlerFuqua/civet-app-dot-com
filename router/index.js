import Router from 'vue-router';

export function createRouter(ssrContext, createDefaultRouter, routerOptions) {
    const options = routerOptions || createDefaultRouter(ssrContext).options;
    const hostname = ssrContext ? ssrContext.req.headers.host : location.host;
    return new Router({
        ...options,
        routes: fixRoutes(options.routes, hostname),
    });
}

function fixRoutes(defaultRoutes, hostname) {

    const rootDomain = process.env.platformHost || 'civetapp.com';

    if (hostname.replace(rootDomain, '') === '') {
        return homeRoutes(defaultRoutes);
    }

    return bulletinRoutes(defaultRoutes);

}
function bulletinRoutes(defaultRoutes) {
    return defaultRoutes.filter(({ name }) => name.includes('bulletin')).map(route => ({
        ...route,
        path: route.path.replace('/bulletins', '/').replace('//', '/')
    }));
}
function homeRoutes(defaultRoutes) {
    return defaultRoutes.filter(({ name }) => name.includes('marketing')).map(route => ({
        ...route,
        path: route.path.replace('/marketing', '/').replace('//', '/')
    }));
}