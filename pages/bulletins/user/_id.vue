<template>
    <div v-if="!loading" class="container mx-auto">

        <!-- Error Message -->
        <ErrorMessage v-if="errorMessage" :errorMessage="errorMessage" :removeErrorMessage="() => errorMessage = null" />

        <!-- Profile Data -->
        <div v-if="userProfile">
            <div class="flex flex-col items-center p-2">
                <img class="rounded-full w-20 my-2" src="https://picsum.photos/200" alt="User Avatar" title="User Avatar" />
                <h2 class="text-xl">{{ userProfile.username }}</h2>
                <button @click="$router.push('/user/edit')" v-if="isCurrentUser" class="text-blue-400 underline mt-2">Edit Profile</button>
            </div>
            <v-divider class="my-3"></v-divider>
        </div>
    </div>
    <div v-else-if="loading" class="flex justify-center items-center h-full">
        <Loading />
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ErrorMessage from '~/components/layout/errorMessage.vue';
import Loading from '~/components/loaders/loading.vue';
import userMixinVue from '~/mixins/userMixin.vue';
export default Vue.extend({
    name: "ProfilePage",
    layout: "userSpace",
    data(): any {
        return {
            currentUserProfile: null,
            isCurrentUser: false,
            getProfileError: null,
            userProfile: null,
            loading: true,
            errorMessage: null
        };
    },
    methods: {
        async init() {
            this.loading = true;
            this.errorMessage = null;

            if (!process?.client) {
                return;
            }

            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;

            this.currentUserProfile = this.$store.state.profile;
            await this.getUserProfile();
            this.isCurrentUser = this.currentUserProfile.id === this.userProfile.id;

            this.loading = false;
        },
        async getUserProfile() {
            const { id } = this.$route.params;
            if (this.currentUserProfile.id === id) {
                this.userProfile = { ...this.currentUserProfile };
                return;
            }
            const { userProfile, error } = await this.getProfileById('id');
            if (error) {
                return this.errorMessage = error;
            }
            this.userProfile = userProfile;
        },
    },
    async created() {
        await this.init();
    },
    components: { Loading, ErrorMessage },
    mixins: [userMixinVue]
})
</script>