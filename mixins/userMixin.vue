<script lang="ts">
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import Vue from 'vue';
import axios from 'axios';
import { markNotificationAsSeen } from '~/utils/notification.utils';

export type UserProfile = {
    id: string
    email: string
    username: string
}

export type SignInResponse = {
    user: User | null
    session: any
    error: any
}

type Data = {
    apiUrl: string
    publicKey: string
    supabase: null | SupabaseClient
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
        async signInWithPassword(data: { email: string, password: string, bulletinId: string }): Promise<SignInResponse> {

            const { email, password, bulletinId } = data;

            let user: User | null = null;
            let session: any;
            let error: any;
            try {
                const { data } = await axios.post('/api/bulletin/login', {
                    email: email.trim().toLowerCase(),
                    password: password.trim(),
                    bulletinId
                });
                user = data.user;
                session = data.session;
            } catch (error: any) {
                let message = error.message || `Error signing in user`;
                if (error.isAxiosError) {
                    console.error(error.response.data);
                    message = error.response?.data?.error || message;
                }
                return { user: null, session: null, error: message }
            }

            if (error) {
                console.error(error);
            }

            if (session) {
                const supabase = this.getClient();
                await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
            }

            return { user, session, error };
        },
        async signUpNewUser(data: { email: string, password: string, bulletinId: string }): Promise<any> {
            try {
                await axios.post('/api/bulletin/signup', {
                    email: data.email.trim().toLowerCase(),
                    password: data.password.trim(),
                    bulletinId: data.bulletinId
                });
            } catch (error: any) {
                let message = error.message || `Error signing up user`;
                if (error.isAxiosError) {
                    console.error(error.response.data);
                    message = error.response?.data?.message || message;
                }
                return { error: message }
            }

        },
        async getCurrentUser(): Promise<User | { error: string }> {
            const supabase = this.getClient();
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                if (error) {
                    console.error(error);
                }
                return { error: error?.message || `Error logging in.` }
            }
            return user;
        },
        async getUserProfile(): Promise<{ userProfile?: UserProfile, error?: string }> {
            const supabase = this.getClient();
            const { data: { user }, error: getUserError } = await supabase.auth.getUser();
            if (getUserError || !user) {
                return { error: getUserError?.message || `Error getting user profile.` }
            }

            const { data: user_profile, error: getProfileError } = await supabase
                .from('user_profile')
                .select('*')
                .eq('id', user.id)
                .single()

            if (getProfileError || !user_profile) {
                return { error: getProfileError?.message || `Error getting user profile.` }
            }
            return { userProfile: user_profile };
        },
        async getProfileById(id: string): Promise<{ userProfile?: UserProfile, error?: string }> {
            const supabase = this.getClient();
            const { data: user_profiles, error: getProfileError } = await supabase
                .from('user_profile')
                .select('*')
                .eq('id', id);

            if (getProfileError) {
                return { error: getProfileError.message }
            }

            if (!user_profiles?.length) {
                return { error: `Profile not found.` }
            }
            return { userProfile: user_profiles[0] };
        },
        async signOutUser(callBack?: Function) {
            const supabase = this.getClient();
            await supabase.auth.signOut();
            this.$store.commit('setProfile', null);
            return callBack ? callBack() : null;
        },
        async getUserByResetToken(resetToken: string): Promise<{ userProfile?: UserProfile, error?: string }> {
            const supabase = this.getClient();
            const { data: userProfiles, error: getUserError } = await supabase.rpc('get_user_by_reset_token', {
                resettoken: resetToken
            });
            if (getUserError || !userProfiles) {
                return { error: getUserError?.message || `Error getting user by reset token.` }
            }
            return { userProfile: userProfiles[0] };
        },
        async resetPassword(email: string, newPassword: string): Promise<{ error: string } | void> {
            const supabase = this.getClient();
            const { data, error } = await supabase.auth.updateUser({
                email: email.trim().toLowerCase(),
                password: newPassword.trim(),
            });
            if (error || !data) {
                return { error: error?.message || `Error resetting user password.` }
            }
        },
        async updateUsername(username: string): Promise<{ error: string } | void> {
            const supabase = this.getClient();

            const { userProfile } = await this.getUserProfile();
            if (!userProfile) {
                return { error: `No profile found to update` }
            }

            const { error } = await supabase
                .from('user_profile')
                .update({ username: username.trim().toLowerCase() })
                .eq('id', userProfile.id)

            if (error) {
                return { error: error.message || `Error updating username.` }
            }
        },
        async leaveJoinedBulletin(profileId: string, bulletinId: string): Promise<void | { error: string }> {
            const supabase = this.getClient();
            const { error } = await supabase
                .from('joined_bulletin')
                .delete()
                .eq('profile_id', profileId)
                .eq('bulletin_id', bulletinId);

            if (error) {
                return { error: error.message }
            }
        },
        async getUserNotifications(profileId: string): Promise<{ error?: string, notifications?: any[] }> {
            const supabase = this.getClient();
            let { data: notifications, error } = await supabase
                .from('notification')
                .select('*')
                .eq('profile_id', profileId);

            if (error || !notifications) {
                return { error: error?.message || `Error getting notifications.` }
            }
            return { notifications };
        },
        async removeNotificationById(id: string): Promise<void | { error: string }> {
            const supabase = this.getClient();
            const { error } = await supabase
                .from('notification')
                .delete()
                .eq('id', id);

            if (error) {
                console.error(error)
                return { error: error.message }
            }
        },
        async markNotificationAsSeen(id: string): Promise<void | { error: string }> {
            const supabase = this.getClient();
            await markNotificationAsSeen(supabase, id);
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
        // this.init();
    }
})
</script>