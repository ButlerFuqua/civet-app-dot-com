<template>
    <v-app dark>
        <Toast />
        <!-- <AddPostModal :showModal="showAddPostModal" :toggleModal="() => showAddPostModal = !showAddPostModal" /> -->

        <!-- Bulletin nav -->
        <v-navigation-drawer v-if="bulletin" v-model="bulletinDrawer" app>
            <div class="p-1 text-center">
                <h2 class="my-2 text-xl">{{ bulletin.title }}</h2>
                <v-divider></v-divider>
            </div>

            <!-- Bulletin owner settings -->
            <v-list-item v-if="userProfile?.id === bulletin.owner_id" to="/admin" router exact>
                <v-list-item-action>
                    <v-icon>mdi-pencil-outline</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                    <v-list-item-title>
                        Manage this bulletin
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>

            <v-list v-else-if="!userProfile">
                <v-list-item @click="() => $router.push('/login')">
                    <v-list-item-action>
                        <v-icon>mdi-login</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Login</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>

            <!-- Bulletin user settings -->
            <div v-else class="p-1 text-center">
                <p v-if="bulletin.description">
                    {{ bulletin.description }}
                </p>
                <p v-else>
                    This bulletin has no description. You should tag the bulletin owner in a post and be like "<span class="italic text-amber-500">Hey, add a description</span>."
                </p>
            </div>
        </v-navigation-drawer>
        <v-app-bar v-if="bulletin" fixed app>
            <v-app-bar-nav-icon @click.stop="bulletinDrawer = !bulletinDrawer" />
            <v-toolbar-title>{{ bulletin.title }}</v-toolbar-title>
            <v-spacer />
            <v-btn v-if="userProfile" @click="$router.push('/posts/add')" icon>
                <v-icon>mdi-plus</v-icon>
            </v-btn>
            <button v-else @click="() => $router.push('/login')">
                Login
            </button>
        </v-app-bar>
        <v-main>
            <Nuxt />
        </v-main>

        <!-- User nav -->
        <v-navigation-drawer v-if="userProfile" v-model="userDrawer" app right>

            <div class="p-1 text-center text-sm">
                <p>Logged in as</p>
                <h2 class="mb-2">{{ userProfile.username }}</h2>
                <v-divider></v-divider>
            </div>

            <!-- Logged in user items -->
            <v-list>
                <v-list-item @click="() => $router.push('/user/notifications')">
                    <v-list-item-action>
                        <v-icon>mdi-chart</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Notifications</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item @click="() => $router.push(`/user/edit`)">
                    <v-list-item-action>
                        <v-icon>mdi-pencil-outline</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Profile</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item @click="() => $router.push('/user/settings')">
                    <v-list-item-action>
                        <v-icon>mdi-chart</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Settings</v-list-item-title>
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

        <!-- User bar -->
        <v-app-bar v-if="userProfile" fixed app bottom>
            <v-spacer />
            <v-app-bar-nav-icon @click.stop="userDrawer = !userDrawer" />
        </v-app-bar>
    </v-app>
</template>
  
<script lang="ts">
import Vue from 'vue';
import AddPostModal from '~/components/bulletin/posts/addPostModal.vue';
import Toast from '~/components/layout/toast.vue';
import bulletinMixinVue from '~/mixins/bulletinMixin.vue';
import userMixinVue from '~/mixins/userMixin.vue';

export default Vue.extend({
    name: "BulletinLayout",
    data(): any {
        return {
            bulletinDrawer: false,
            userDrawer: false,
            bulletin: null,
            showAddPostModal: false,
            userProfile: null
        };
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

            const bulletin = this.$store.state.bulletin ?? await this.getBulletinBySlug();
            if (!bulletin) {
                return this.$router.push({
                    path: '/login',
                    query: { message: `Error getting bulletin`, color: `text-rose-600` }
                });
            }
            this.$store.commit("setBulletin", bulletin);

            if (!bulletin.private) {
                this.bulletin = bulletin;
                this.$nuxt.$emit("bulletin_update");
            }

            this.userProfile = this.$store.state.profile;
            if (!this.userProfile) {
                const { error: getUserError } = await this.getCurrentUser();
                if (getUserError && bulletin.private) {
                    return this.$router.push({
                        path: '/login',
                        query: { message: getUserError, color: `text-rose-600` }
                    });
                }

                const getProfileError = await this.getProfile();
                if (getProfileError && bulletin.private) {
                    return this.$router.push({
                        path: '/login',
                        query: { message: getProfileError, color: `text-rose-600` }
                    });
                }
            }

            if (bulletin.private) {
                this.bulletin = bulletin;
                this.$nuxt.$emit("bulletin_update");
            }

            const { login } = this.$route.query
            if (login) {
                this.$nuxt.$emit('toast', {
                    message: `Logged in as ${this.userProfile.username}`,
                });
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
        await this.init();
        this.$nuxt.$on('bulletin_update', () => {
            this.bulletin = this.$store.state.bulletin;
        });
        const { message } = this.$route.query
        if (message) {
            this.$nuxt.$emit('toast', {
                message,
            });
        }
    },
    beforeDestroy() {
        this.$nuxt.$off('bulletin_update');
    },
    components: { AddPostModal, Toast },
    mixins: [bulletinMixinVue, userMixinVue]
})
</script>
  