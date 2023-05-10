<template>
    <div id="loginPageWrapper" :class="!errorMessage ? 'from-purple-500 to-amber-300' : 'from-gray-700 to-gray-500'" class="flex flex-col justify-center items-center bg-gradient-to-t">

        <div v-if="!errorMessage && bulletin" id="formWrapper">
            <div class="text-center mb-2 bg-white rounded p-3">
                <h1 class="font-black text-2xl">{{ bulletin.title }}</h1>
                <p class="mt-1">{{ bulletin.description }}</p>
            </div>
            <div class="rounded-md shadow-lg bg-white p-3 pt-5 text-center">
                <form v-if="!submitting" @submit.prevent="submit">
                    <div v-if="!resetToken">
                        <h2 class="text-center mb-3 font-black text-purple-700 text-3xl">
                            {{ login ? 'Login' : signup ? 'Signup' : '' }}
                        </h2>
                        <v-text-field outlined rounded dense v-model="email" aria-placeholder="email" placeholder="email" required :rules="emailRules"></v-text-field>
                        <v-text-field v-if="!forgot" type="password" outlined rounded dense v-model="password" aria-placeholder="password" placeholder="password" required :rules="passwordRules"></v-text-field>
                        <div class="flex justify-center">
                            <button :disabled="!validForm" :class="validForm ? 'bg-black text-white shadow-md' : 'text-gray-400'" class="rounded-full py-1 px-5 transition-all text-lg">
                                {{ !forgot ? 'Enter' : 'Send' }}
                            </button>
                        </div>
                    </div>

                    <!-- Confirm password reset -->
                    <div v-else>
                        <h2 class="text-center mb-3 font-black text-purple-700 text-3xl">
                            Create a new password
                        </h2>
                        <v-text-field v-if="!forgot" type="password" outlined rounded dense v-model="password" aria-placeholder="password" placeholder="password" required :rules="passwordRules"></v-text-field>
                        <v-text-field v-if="!forgot" type="password" outlined rounded dense v-model="password2" aria-placeholder="confirm password" placeholder="confirm password" required :rules="passwordRules"></v-text-field>
                        <div class="flex justify-center">
                            <button :disabled="!validForm" :class="validForm ? 'bg-black text-white shadow-md' : 'text-gray-400'" class="rounded-full py-1 px-5 transition-all text-lg">
                                Send
                            </button>
                        </div>
                    </div>
                </form>
                <div v-else class="flex justify-center items-center">
                    <Loading />
                </div>
                <div v-if="!submitting">
                    <v-divider class="my-5"></v-divider>
                    <div v-if="!resetToken" class="flex justify-between">
                        <button @click="toggleForgot" class="text-blue-600">
                            {{ !forgot ? 'I forgot :(' : 'I remember :)' }}</button>
                        <button v-if="!forgot" @click="toggleLoginSignup" class="text-amber-600 font-black">
                            {{ login ? 'Create Account' : signup ? 'Login instead' : '' }}
                        </button>
                    </div>
                    <div v-else class="flex justify-between">
                        <button @click="removeRestToken" class="text-blue-600">
                            Login instead
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="errorMessage" class="bg-red-600 p-3 text-center sm:rounded">
            <p class="text-white ">{{ errorMessage }}</p>
            <p>
                <a :href="platformUrl" class="font-semibold underline text-white hover:text-amber-300 transition-all">Create a bulletin</a>
            </p>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Joi from 'joi';

import bulletinMixinVue from '~/mixins/bulletinMixin.vue';
import userMixinVue from '~/mixins/userMixin.vue';
import axios from 'axios';
import Loading from '~/components/loaders/loading.vue';
import ErrorMessage from '~/components/layout/errorMessage.vue';

const schema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }),
    bulletinTitle: Joi.string().min(4).max(100),
    password: Joi.string().min(6),
});


export default Vue.extend({
    name: "LoginPage",
    layout: "login",
    mixins: [bulletinMixinVue, userMixinVue],
    components: { Loading, ErrorMessage },
    computed: {
        validForm(): boolean {
            if (!this.forgot) {
                return schema.validate({
                    email: (this as any).email?.trim(),
                    bulletinTitle: (this as any).bulletinTitle?.trim(),
                    password: (this as any).password?.trim()
                }).error ? false : true;
            }
            return schema.validate({
                email: (this as any).email.trim(),
            }).error ? false : true;
        }
    },
    data(): any {
        return {
            email: "",
            password: "",
            emailRules: [
                (v: string) => !!v || "Email is required",
                (email: string) => !schema.validate({ email }).error || schema.validate({ email }).error?.details[0].message,
            ],
            passwordRules: [
                (v: string) => !!v || "Password is required",
                (password: string) => !schema.validate({ password }).error || schema.validate({ password }).error?.details[0].message,
            ],
            login: true,
            signup: false,
            forgot: false,
            errorMessage: null,
            platformUrl: "",
            bulletin: null,
            submitting: true,
            resetToken: null
        };
    },
    methods: {
        async init() {
            if (!process?.client) {
                return;
            }
            const { platformHost } = process.env;
            this.platformUrl = `https://${platformHost}`;
            if (platformHost?.includes("localhost:")) {
                this.platformUrl = this.platformUrl.replace("https://", "http://");
            }
            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;
            this.$store.commit('removeProfile');
            await this.checkThatBulletinExists();
            this.submitting = false;
        },
        toggleLoginSignup() {
            this.login = !this.login;
            this.signup = !this.signup;
            this.forgot = false;
            this.resetToken = null;
        },
        toggleForgot() {
            this.forgot = !this.forgot;
            this.login = this.forgot ? false : true;
            this.signup = false;
            this.resetToken = null;
        },
        removeRestToken() {
            this.toggleLoginSignup();
            this.login = true;
        },
        resetIsTrue() {
            this.login = false;
            this.signup = false;
            this.forgot = false;
        },
        async checkThatBulletinExists() {
            const { hostname, host } = window.location;
            const slug = hostname.split(".")[0];
            this.bulletin = await this.getBulletinBySlug(slug);
            if (!this.bulletin) {
                this.errorMessage = `There doesn't seem to be a bulletin located at ${host}`;
            }
            this.$store.commit('setBulletin', this.bulletin)
        },
        async submit() {
            this.submitting = true;
            if (this.login) {
                await this.loginSubmit();
            }
            else if (this.signup) {
                await this.signupSubmit();
            }
            else if (this.forgot) {
                await this.forgotSubmit();
            }
            else if (this.resetToken) {
                await this.resetSubmit();
            }
            this.submitting = false;
        },
        async loginSubmit() {
            if (!this.validForm) {
                return;
            }
            const { user, session, error } = await this.signInWithPassword({
                email: this.email.trim(),
                password: this.password.trim(),
                bulletinId: this.bulletin.id,
            });
            if (error) {
                return this.$nuxt.$emit("toast", {
                    message: error,
                    textColor: `text-rose-500`
                });
            }
            if (user && session) {
                return this.$router.push({
                    path: "/",
                    query: { login: `true` }
                });
            }
            this.$nuxt.$emit("toast", {
                message: `Error logging in`,
                textColor: `text-rose-500`
            });
        },
        async signupSubmit() {
            if (!this.validForm) {
                return;
            }

            const response = await this.signUpNewUser({
                email: this.email.trim(),
                password: this.password.trim(),
                bulletinId: this.bulletin.id
            });
            if (response?.error) {
                return this.$nuxt.$emit("toast", {
                    message: response.error,
                    textColor: `text-rose-500`
                });
            }
            this.toggleLoginSignup();
            this.$nuxt.$emit('toast', {
                message: `Success! Click "Enter" to login.`,
                textColor: `text-green-500`
            });
        },
        async forgotSubmit() {
            if (!this.validForm) {
                return;
            }
            try {
                const { data } = await axios.post(`/api/email/send-password-reset`, {
                    email: this.email.trim(),
                    bulletinId: this.bulletin.id
                });
                this.$nuxt.$emit("toast", {
                    message: data.message,
                    textColor: `text-teal-300`
                });
            }
            catch (error: any) {
                let message = error.message || `Error sending email`;
                if (error.isAxiosError) {
                    console.error(error.response.data);
                    message = error.response?.data?.error || message;
                }
                this.$nuxt.$emit("toast", {
                    message,
                    textColor: `text-rose-500`
                });
            }
        },
        async checkRestToken() {
            if (!process?.client) {
                return;
            }
            const { reset_token } = this.$route.query;
            if (!reset_token) {
                return;
            }
            this.submitting = true;
            this.resetToken = reset_token;
            const { userProfile, error } = await this.getUserByResetToken(this.resetToken);
            if (error) {
                this.removeRestToken();
                this.submitting = false;
                return this.$nuxt.$emit('toast', {
                    message: error,
                    textColor: 'text-rose-500'
                });
            }
            this.$store.commit('setProfile', userProfile);
            this.email = userProfile.email;
            this.resetIsTrue();
            this.submitting = false;
        },
        async resetSubmit() {
            if (this.password.trim() !== this.password2.trim()) {
                return this.$nuxt.$emit('toast', {
                    message: `Passwords do not match`,
                    textColor: 'text-rose-500'
                });
            }
            this.submitting = true;
            const newPassword = this.password.trim();
            const response = await this.resetPassword(this.email.trim(), newPassword);
            if (response?.error) {
                return this.$nuxt.$emit('toast', {
                    message: response.error,
                    textColor: 'text-rose-500'
                });
            }
            this.password = newPassword;
            this.toggleLoginSignup();
            this.submitting = false;
        }
    },
    async created() {
        await this.init();
        await this.checkRestToken();
    },
})

</script>

<style lang="scss" scoped>
#loginPageWrapper {
    overflow: auto;
    height: 95vh;
    // background: url('~assets/images/mobile_landing.png');
    background-position: center;
    background-size: cover;

    transition: all .2s;

    @media screen and (min-width: 700px) {
        // background: url('~assets/images/desktop_landing.png');
        background-position: center;
        background-size: cover;
        height: 100vh;
    }
}

#formWrapper {
    width: 350px;
    max-width: 100%;
}
</style>