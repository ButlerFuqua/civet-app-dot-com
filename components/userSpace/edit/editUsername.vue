<template>
    <!-- Error Message -->
    <ErrorMessage v-if="errorMessage" :errorMessage="errorMessage" :removeErrorMessage="() => errorMessage = null" />
    <div v-else>

        <!-- Display -->
        <div v-if="!editUsername && username">
            <p>{{ username }}</p>
            <button @click="editUsername = true" class="text-amber-500">Edit</button>
        </div>

        <!-- Edit -->
        <div v-else-if="!loading" class="flex flex-col justify-center">
            <form @submit.prevent="saveUsername" class="flex flex-col mb-2">
                <v-text-field outlined dense v-model="username" aria-placeholder="edit username" required :rules="usernameRules"></v-text-field>
                <p>preview: {{ displayUsername }}</p>
                <button :disabled="!validForm" :class="validForm ? 'bg-purple-500 text-white' : 'text-gray-300'" class=" py-2 px-3 rounded-full">Save</button>
            </form>
            <button @click="cancel" class="text-amber-500">Cancel</button>
        </div>
        <div v-else class="flex items-center justify-center">
            <Loading width="150px" />
        </div>

        <v-divider class="my-3"></v-divider>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Joi from 'joi';
import userMixinVue from '~/mixins/userMixin.vue';
import Loading from '~/components/loaders/loading.vue';

const schema = Joi.object({
    username: Joi.string().min(6).max(30),
});

const getUsernameSlug = (str: string) => {
    return str.toLowerCase().trim().replace(/[^a-z0-9-_\.]/gi, '');
}

export default Vue.extend({
    name: "EditUsername",
    data(): any {
        return {
            editUsername: false,
            userProfile: null,
            username: null,
            usernameRules: [
                (v: string) => !!v || "Username is required",
                (username: string) => !schema.validate({ username: getUsernameSlug(username) }).error || `Username not valid`,
            ],
            loading: true,
            errorMessage: null,
        };
    },
    computed: {
        displayUsername() {
            return getUsernameSlug(this.username);
        },
        validForm(): boolean {
            return schema.validate({
                username: getUsernameSlug((this as any).username),
            }).error ? false : true;
        }
    },
    methods: {
        async init() {
            this.loading = true;
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
            this.userProfile = userProfile;
            this.username = userProfile.username;
            this.editUsername = false;
            this.loading = false;
        },
        async cancel() {
            this.editUsername = false;
            this.username = this.userProfile.username;
        },
        async saveUsername() {

            if (!this.validForm) {
                return this.$nuxt.$emit('toast', {
                    message: `Username not valid`,
                    textColor: `text-rose-500`
                });
            }

            this.loading = true;

            const response = await this.updateUsername(getUsernameSlug(this.username));
            if (response?.error) {
                this.$nuxt.$emit('toast', {
                    message: response.error,
                    textColor: `text-rose-500`
                });
            } else {
                this.$store.commit('setProfile', {
                    ...this.userProfile,
                    username: this.username,
                });
                this.$nuxt.$emit('profile_update');
            }
            await this.init();
        }
    },
    async created() {
        await this.init();
    },
    mixins: [userMixinVue],
    components: { Loading }
});
</script>