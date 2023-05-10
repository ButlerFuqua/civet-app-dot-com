<template>
    <div class="md:container md:mx-auto h-full">

        <!-- <EditTitleModal :showModal="showEditTitleModal" :toggleModal="() => showEditTitleModal = !showEditTitleModal" /> -->

        <v-list v-if="!loading" dense>
            <v-list-item-group>
                <v-list-item v-for="(item, i) in items" :key="i" @click="item.action">
                    <v-list-item-icon>
                        <v-icon v-text="item.icon"></v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title v-text="item.label"></v-list-item-title>
                        <v-list-item-subtitle>
                            {{ item.description }}
                        </v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list-item-group>
        </v-list>

        <div v-else class="flex h-full justify-center items-center">
            <Loading />
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

import userMixinVue from '~/mixins/userMixin.vue';
import bulletinMixinVue from '~/mixins/bulletinMixin.vue';
import Loading from '~/components/loaders/loading.vue';


export default Vue.extend({
    name: "UserSettings",
    layout: "userSpace",
    data(): any {
        return {
            items: [],
            bulletin: null,
            userProfile: null,
            loading: false
        };
    },
    methods: {
        init() {
            if (!process?.client) {
                return
            }
            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;
            this.bulletin = this.$store.state.bulletin;
            if (!this.bulletin) {
                return this.$router.push({
                    path: "/",
                    message: "Bulletin not found"
                });
            }

            this.userProfile = this.$store.state.profile;
            if (!this.userProfile) {
                return this.$router.push({
                    path: "/",
                    message: "User profile not found"
                });
            }

            this.items = [
                // {
                //     label: "Preferences",
                //     icon: "mdi-chart",
                //     description: `Privacy and what not`,
                //     action: () => console.log('PREFERENCES!')
                // },
                {
                    label: "Leave Bulletin",
                    icon: "mdi-run",
                    description: `Your account will be deleted if you have no other bulletins`,
                    action: this.leaveBulletin
                },
                // {
                //     label: "Delete Account",
                //     icon: "mdi-run",
                //     description: `Leave all bulletins and your account`,
                //     action: () => console.log('DELETE!')
                // },
            ];
        },
        async leaveBulletin() {
            if (this.userProfile.id === this.bulletin.owner_id) {
                return this.$nuxt.$emit('toast', {
                    message: `An owner may not leave their own bulletin.`,
                    textColor: `text-rose-500`
                })
            }
            if (!confirm(`Are you sure you want to delete all your posts and leave?`)) {
                return this.$nuxt.$emit('toast', {
                    message: `Phew! That was close.`
                })
            }
            this.loading = true;

            const response = await this.leaveJoinedBulletin(this.userProfile.id, this.bulletin.id);

            if (response?.error) {
                this.loading = false;
                return this.$nuxt.$emit('toast', {
                    message: response.error,
                    textColor: `text-rose-500`
                })
            }

            await this.signOutUser();
            this.$router.push('/login');

        },

    },
    created() {
        this.init();
        this.$nuxt.$on('bulletin_update', this.init);
    },
    beforeDestroy() {
        this.$nuxt.$off('bulletin_update');
    },
    components: { Loading },
    mixins: [bulletinMixinVue, userMixinVue]
});
</script>