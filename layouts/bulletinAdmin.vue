<template>
    <v-app dark>
        <Toast />
        <!-- Bulletin nav -->
        <v-navigation-drawer v-model="drawer" app>
            <div v-if="userProfile">
                <v-list-item>
                    <v-list-item-action>
                        <v-icon>mdi-logout</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>
                            {{ userProfile.username }}
                        </v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </div>
            <v-list-item to="/" router exact>
                <v-list-item-action>
                    <v-icon>mdi-home</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                    <v-list-item-title>
                        Home
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>
            <v-list-item to="/admin" router exact>
                <v-list-item-action>
                    <v-icon>mdi-list</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                    <v-list-item-title>
                        Settings
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-navigation-drawer>
        <v-app-bar v-if="bulletin" fixed app>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
            <v-toolbar-title>{{ bulletin.title }}</v-toolbar-title>
        </v-app-bar>
        <v-main>
            <Nuxt />
        </v-main>
    </v-app>
</template>
  
<script lang="ts">
import Vue from 'vue';
import Toast from '~/components/layout/toast.vue';

export default Vue.extend({
    name: "BulletinAdminLayout",
    computed: {
        bulletin() {
            return this.$store.state.bulletin;
        }
    },
    data(): any {
        return {
            drawer: false,
            showAddPostModal: false,
            userProfile: null,
        };
    },
    methods: {
        async init() {
            const bulletin = this.$store.state.bulletin;
            const profile = this.$store.state.profile;

            if (!bulletin) {
                return this.$router.push({
                    path: '/',
                    query: { message: `Bulletin not found`, color: `text-rose-600` }
                });
            }

            if (!profile) {
                return this.$router.push({
                    path: '/login',
                    query: { message: `Profile not found`, color: `text-rose-600` }
                });
            }

            if (bulletin.owner_id !== profile.id) {
                return this.$router.push({
                    path: '/',
                    query: { message: `User not authorized for this bulletin's settings.`, color: `text-rose-600` }
                });
            }

        }
    },
    async created() {
        this.$nuxt.$on('bulletin_update', this.init);

    },
    beforeDestroy() {
        this.$nuxt.$off('bulletin_update');
    },
    components: { Toast }
})
</script>
  