<script lang="ts">
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import Vue from 'vue';
import { UserProfile } from './userMixin.vue';


export type Bulletin = {
    id: string
    slug: string
    title: string
    owner_id: string
    about: string
}

export type CustomDomain = {
    id: string
    name: string
}

type Data = {
    apiUrl: string
    publicKey: string
    supabase: null | SupabaseClient
}

// utils
export const getSlugFromCustomDomain = async (name: string, supabase: SupabaseClient): Promise<string | void> => {
    const { data: bulletins, error: getDomainsError } = await supabase.rpc('get_bulletin_by_domain', {
        domainname: name,
    });
    if (getDomainsError || !bulletins) {
        return;
    }
    const bulletin = bulletins[0]
    if (bulletin) {
        return bulletin.slug
    }
}

export const getSlugFromHost = async (supabase: SupabaseClient): Promise<string | void> => {
    const rootDomain = process.env.platformHost || 'civetapp.com';
    const host = location.host
    const onCustomDomain = !host.includes(rootDomain);
    if (onCustomDomain) {
        return getSlugFromCustomDomain(host, supabase);
    }
    const { hostname } = window.location;
    return hostname.split(".")[0];
}

export default Vue.extend({
    name: 'BulletinMixin',
    data(): Data {
        return {
            apiUrl: '',
            publicKey: '',
            supabase: null
        }
    },
    methods: {
        async getBulletinBySlug(bulletinSlug?: string): Promise<Bulletin | void> {

            let slug = bulletinSlug?.trim().toLowerCase();

            const supabase = createClient(this.apiUrl, this.publicKey);
            if (!slug) {
                const slugFromHost = await getSlugFromHost(supabase);
                if (!slugFromHost) {
                    return;
                }
                slug = slugFromHost;
            }

            const { data: bulletins, error } = await supabase
                .from('bulletin')
                .select('*')
                .eq('slug', slug);
            if (error) {
                console.error(error);
                return;
            }
            if (!bulletins?.length) {
                return;
            }
            return bulletins[0];
        },
        async getBulletinDomains(bulletinId: string): Promise<{ domains?: CustomDomain[], error?: string }> {
            const supabase = this.getClient();
            const { data: custom_domains, error } = await supabase
                .from('custom_domain')
                .select('*')
                .eq('bulletin_id', bulletinId);

            if (error) {
                return { error: error.message };
            }

            return { domains: custom_domains ?? undefined };
        },
        async toggleBulletinPrivate(bulletinId: string, privateBulletin: boolean): Promise<void | { error: string }> {
            const supabase = this.getClient();
            const { error } = await supabase
                .from('bulletin')
                .update({
                    private: privateBulletin,
                })
                .eq('id', bulletinId);

            if (error) {
                return { error: error.message };
            }

            return;
        },
        async addCustomDomain(data: {
            bulletinId: string,
            userId: string,
            name: string,
        }): Promise<void | { error: string }> {

            const { name: nameRequest, userId, bulletinId } = data;
            const name = nameRequest.trim().toLowerCase();

            try {
                await axios.post(`/api/bulletin/add-custom-domain`, {
                    name, userId, bulletinId
                });
            } catch (error: any) {
                return { error: error.response?.data?.error?.toString() || `Error updating subdomain` }
            }

            return;
        },
        async getCustomDomainConfigs(data: {
            userId: string,
            name: string,
        }): Promise<{ error?: string, configuredCorrectly?: boolean }> {

            const { name: nameRequest, userId } = data;
            const name = nameRequest.trim().toLowerCase();

            let response: { configuredCorrectly?: boolean } = {};
            try {
                // removed
                const { data: configData } = await axios.post(`/api/bulletin/check-domain-config`, {
                    name, userId
                });
                response = configData;
            } catch (error: any) {
                return { error: error.response?.data?.error?.toString() || `Error updating subdomain` }
            }

            return response;
        },
        async deleteCustomDomain(data: {
            userId: string,
            name: string,
        }): Promise<void | { error: string }> {
            const { name: nameRequest, userId, } = data;
            const name = nameRequest.trim().toLowerCase();

            try {
                await axios.post(`/api/bulletin/remove-custom-domain`, {
                    name,
                    userId,
                });
            } catch (error: any) {
                return { error: error.response?.data?.error?.toString() || `Error deleting subdomain` }
            }
        },
        async handleDeleteBulletin(data: { bulletinId: string, email: string, userId: string }) {
            const { userId, email, bulletinId } = data;
            try {
                await axios.post(`/api/bulletin/delete-bulletin`, {
                    userId, email, bulletinId
                });
            } catch (error: any) {
                return { error: error.response?.data?.error?.toString() || `Error deleting subdomain` }
            }
        },
        async getJoinedUsersByBulletinId(bulletinId: string, ownerId: string): Promise<{ error?: string, joinedUsers?: UserProfile[] }> {

            let profiles: UserProfile[] | undefined;
            try {
                const { data: userProfiles } = await axios.post(`/api/bulletin/get-users-by-bulletin-id`, {
                    ownerId, bulletinId
                });
                profiles = userProfiles;
            } catch (error: any) {
                return { error: error.response?.data?.error?.toString() || `Error getting joined users` }
            }

            return { joinedUsers: profiles || [] }
        },
        async getBannedUsersByBulletinId(bulletinId: string, ownerId: string): Promise<{ error?: string, bannedUsers?: UserProfile[] }> {

            let profiles: UserProfile[] | undefined;
            try {
                const { data: userProfiles } = await axios.post(`/api/bulletin/get-banned-users-by-bulletin-id`, {
                    ownerId, bulletinId
                });
                profiles = userProfiles;
            } catch (error: any) {
                return { error: error.response?.data?.error?.toString() || `Error getting joined users` }
            }

            return { bannedUsers: profiles || [] }
        },
        async removeUserFromBulletin(data: {
            userId: string, bulletinId: string, ownerId: string
        }): Promise<{ error?: string } | void> {
            const { userId, bulletinId, ownerId } = data;

            if (userId === ownerId) {
                return { error: `Owner of bulletin may not be banned` }
            }

            try {
                await axios.post(`/api/bulletin/remove-user-from-bulletin`, {
                    userId, bulletinId, ownerId
                });
            } catch (error: any) {
                return { error: error.response?.data?.error?.toString() || `Error deleting subdomain` }
            }
        },
        async banUserFromBulletin(data: {
            userId: string, bulletinId: string, ownerId: string
        }): Promise<{ error?: string } | void> {

            const { bulletinId, userId, ownerId } = data;
            if (userId === ownerId) {
                return { error: `Owner of bulletin may not be banned` }
            }

            const errorResponse = await this.removeUserFromBulletin(data);
            if (errorResponse) {
                return errorResponse;
            }

            const supabase = this.getClient();
            const { error } = await supabase
                .from('banned_user')
                .insert([
                    {
                        bulletin_id: bulletinId,
                        profile_id: userId,
                        owner_id: ownerId
                    },
                ]);

            if (error) {
                return { error: error.message };
            }
        },
        async unBanUserFromBulletin(data: {
            userId: string, bulletinId: string
        }): Promise<{ error?: string } | void> {

            const { bulletinId, userId } = data;

            const supabase = this.getClient();
            const { error } = await supabase
                .from('banned_user')
                .delete()
                .eq('bulletin_id', bulletinId)
                .eq('profile_id', userId)

            if (error) {
                return { error: error.message };
            }



        },
        getClient(): SupabaseClient {
            if (this.supabase) {
                return this.supabase as SupabaseClient;
            }
            this.supabase = createClient(this.apiUrl, this.publicKey)
            return this.supabase;
        }
    },
    created() {
    }
})
</script>