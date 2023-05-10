<template>
    <div v-if="!loading" class="container mx-auto">

        <!-- Error Message -->
        <ErrorMessage v-if="errorMessage" :errorMessage="errorMessage" :removeErrorMessage="() => errorMessage = null" />

        <!-- Profile Data -->
        <div v-if="userProfileData">
            <div class="flex flex-col items-center p-2">
                <img class="rounded-full w-20 my-2" src="https://picsum.photos/200" alt="User Avatar" title="User Avatar" />
                <button class="text-blue-400 underline mb-2">Edit Profile Picture</button>
            </div>
            <v-divider class="my-3"></v-divider>

            <!-- Edit username -->
            <EditUsername />


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
import EditUsername from '~/components/userSpace/edit/editUsername.vue';

export default Vue.extend({
    name: "ProfilePage",
    layout: "userSpace",
    data(): any {
        return {
            userProfileData: null,
            loading: true,
            errorMessage: null,
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

            const { userProfile, error } = await this.getUserProfile();
            if (error) {
                this.loading = false;
                return this.errorMessage = error;
            }

            this.userProfileData = userProfile;

            this.loading = false;
        },
    },
    async created() {
        await this.init();
    },
    components: { Loading, ErrorMessage, EditUsername, },
    mixins: [userMixinVue]
})
</script>