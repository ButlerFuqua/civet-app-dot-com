<template>
    <v-dialog v-model="showModal" fullscreen :scrim="false" transition="dialog-bottom-transition">
        <v-card tile>
            <v-toolbar dark color="orange">
                <v-btn icon dark @click="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Remove User</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn color="white" text @click="cancel">
                        Cancel
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <div v-if="bulletin" class="container mx-auto">
                <ErrorMessage v-if="errorMessage" :errorMessage="errorMessage" :removeErrorMessage="() => errorMessage = null" />
                <div class="mt-5">
                    <h2 class="text-amber-500 font-black text-3xl">Important!</h2>
                    <p>This option will remove the user from your bulletin, but they may be able to join again if they create an account. Choose "Ban User" to permanently remove them.</p>
                    <p>All of the removed user's posts will be deleted. They will have to create an account to login again.</p>
                </div>

                <div v-if="!submitting" @submit.prevent="submit" class="mt-5">

                    <!-- List of users -->
                    <v-divider class="my-3"></v-divider>
                    <p v-if="joinedUsers && !joinedUsers.length" class="mt-3">No users to remove at this time</p>
                    <v-list v-if="joinedUsers" dense>
                        <v-list-item-group>
                            <v-list-item v-for="(user, i) in joinedUsers" :key="i" @click="toggleSelectUser(user)">
                                <!-- <v-list-item-avatar>
                                    <v-img :src="user.avatar"></v-img>
                                </v-list-item-avatar> -->
                                <v-list-item-content>
                                    <v-list-item-title v-text="user.username"></v-list-item-title>
                                    <!-- <v-list-item-subtitle>
                                        // ?
                                    </v-list-item-subtitle> -->
                                </v-list-item-content>
                            </v-list-item>
                        </v-list-item-group>
                    </v-list>

                    <div v-if="userToRemove" class="flex flex-col justify-center items-center absolute bottom-0 bg-red-500 z-40 w-full p-5">
                        <button @click="submit" :disabled="!validForm" :class="validForm ? 'bg-white text-black shadow-md' : 'text-gray-400'" class="rounded-full py-1 px-5 transition-all text-lg">
                            Remove User
                        </button>
                        <button class="mt-3 underline" @click="userToRemove = null">
                            Never Mind
                        </button>
                    </div>
                </div>
                <div v-else class="flex justify-center items-center">
                    <Loading />
                </div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';

import Loading from '~/components/loaders/loading.vue';
import CloseIcon from '~/components/icons/closeIcon.vue';
import ErrorMessage from '~/components/layout/errorMessage.vue';
import bulletinMixinVue from '~/mixins/bulletinMixin.vue';
import { UserProfile } from '~/mixins/userMixin.vue';


export default Vue.extend({
    name: "DeleteBulletinModal",
    props: ["showModal", "toggleModal",],
    computed: {
        validForm(): boolean {
            return this.userToRemove !== null;
        }
    },
    data(): any {
        return {
            apiUrl: "",
            publicKey: "",
            bulletin: null,
            submitting: false,
            platformHost: "",
            platformUrl: "",
            errorMessage: null,
            userToRemove: null,
            joinedUsers: null
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
            this.bulletin = this.$store.state.bulletin;
            this.platformHost = process.env.platformHost;
            this.submitting = false;
            this.platformUrl = `https://${this.platformHost}`;
            if (this.platformHost.includes("localhost:")) {
                this.platformUrl = this.platformUrl.replace("https://", "http://");
            }
            await this.getJoinedUsers();
        },
        cancel() {
            this.toggleModal();
            this.init();
        },
        toggleSelectUser(user: UserProfile) {
            if (this.userToRemove?.id !== user.id) {
                return this.userToRemove = user;
            }
            this.userToRemove = null;
        },
        async getJoinedUsers() {
            this.submitting = true;
            const { joinedUsers, error } = await this.getJoinedUsersByBulletinId(this.bulletin.id);
            if (error) {
                this.submitting = false;
                return this.errorMessage = error;
            }
            if (!this.$store.state.profile) {
                return this.$router.push({
                    path: '/login',
                    query: { message: 'No logged in profile found.' }
                })
            }
            this.joinedUsers = joinedUsers.filter((user: UserProfile) => user.id !== this.$store.state.profile.id);
            this.submitting = false;
        },
        async submit() {
            if (!this.validForm) {
                return;
            }
            this.submitting = true;
            const { id } = this.$store.state.profile;
            const response = await this.removeUserFromBulletin({
                bulletinId: this.bulletin.id.trim(),
                userId: this.userToRemove.id,
                ownerId: id
            });
            if (response?.error) {
                this.errorMessage = response.error;
                this.userToRemove = null;
                this.submitting = false;
                return;
            }
            this.userToRemove = null;
            await this.getJoinedUsers();
            this.submitting = false;
        }
    },
    async created() {
        await this.init();
    },
    components: { Loading, CloseIcon, ErrorMessage },
    mixins: [bulletinMixinVue]
});
</script>

<style lang="scss" scoped>
li {
    list-style: disc;
}

.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
    transition: transform .2s ease-in-out;
}
</style>