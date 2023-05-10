<template>
    <v-app dark>
        <Toast />
        <!-- <AddPostModal :showModal="showAddPostModal" :toggleModal="() => showAddPostModal = !showAddPostModal" /> -->
        <v-main>
            <Nuxt />
        </v-main>

        <!-- User nav -->
        <v-navigation-drawer v-if="bulletin" v-model="userDrawer" app right>

            <div v-if="userProfile" class="p-1 text-center text-sm">
                <p>Logged in as</p>
                <h2 class="mb-2">{{ userProfile.username }}</h2>
                <v-divider></v-divider>
            </div>

            <v-list v-else>
                <v-list-item @click="() => $router.push('/login')">
                    <v-list-item-action>
                        <v-icon>mdi-login</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Login</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>

            <!-- Logged in user items -->
            <v-list v-if="userProfile">
                <v-list-item @click="() => $router.push(`/`)">
                    <v-list-item-action>
                        <v-icon>mdi-home</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Bulletin</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item @click="signOut">
                    <v-list-item-action>
                        <v-icon>mdi-logout</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Logout</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>

        </v-navigation-drawer>
        <v-app-bar v-if="bulletin" fixed app bottom>
            <v-spacer />
            <v-app-bar-nav-icon @click.stop="userDrawer = !userDrawer" />
        </v-app-bar>
    </v-app>
</template>
  
<script lang="ts">
import Vue from 'vue';
import Toast from '~/components/layout/toast.vue';
import bulletinMixinVue from '~/mixins/bulletinMixin.vue';
import userMixinVue from '~/mixins/userMixin.vue';

export default Vue.extend({
    name: "UserSpaceLayout",
    data(): any {
        return {
            userDrawer: false,
            // bulletin: null,
            userProfile: null,
        };
    },
    computed: {
        bulletin() {
            return this.$store.state.bulletin
        }
    },
    methods: {
        async init() {
            if (!process?.client) {
                return;
            }
            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;

            if (!this.bulletin) {
                return this.$router.push(`/`);
            }

            this.userProfile = this.$store.state.profile;
            if (!this.userProfile) {
                const { error: getUserError } = await this.getCurrentUser();
                if (getUserError) {
                    return this.$router.push({
                        path: '/login',
                        query: { message: getUserError, color: `text-rose-600` }
                    });
                }
                const getProfileError = await this.getProfile();
                if (getProfileError) {
                    return this.$router.push({
                        path: '/login',
                        query: { message: getProfileError, color: `text-rose-600` }
                    });
                }
            }
        },
        async getProfile(): Promise<void | string> {
            const { userProfile, error: getProfileError } = await this.getUserProfile();
            if (getProfileError || !userProfile) {
                return getProfileError?.message || `Error getting user profile.`
            }
            this.$store.commit("setProfile", userProfile);
            this.userProfile = userProfile;
        },
        async signOut() {
            await this.signOutUser();
            this.$store.commit('removeProfile');
            return this.$router.push('/login');
        }
    },
    async created() {

        this.$nuxt.$on('profile_update', () => {
            this.userProfile = this.$store.state.profile;
        });

        await this.init();
        const { message } = this.$route.query
        if (message) {
            this.$nuxt.$emit('toast', {
                message,
            });
        }
    },
    beforeDestroy() {
        this.$nuxt.$off('profile_update');
    },
    components: { Toast },
    mixins: [bulletinMixinVue, userMixinVue]
})
</script>
  