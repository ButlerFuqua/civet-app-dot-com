<template>
    <v-dialog persistent v-model="showModal" fullscreen :scrim="false" transition="dialog-bottom-transition">
        <v-card tile>
            <v-toolbar dark color="primary">
                <v-btn icon dark @click="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Edit subdomain</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn color="white" text @click="cancel">
                        Cancel
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <div class="container mx-auto">
                <div class="mt-5">
                    <h2 class="text-amber-500 font-black text-3xl">Important!</h2>
                    <p><span class="text-purple-500 font-semibold">Changing</span> your <span class="text-purple-500 font-semibold">subdomain</span> will do the following:</p>
                    <ul>
                        <li v-if="onSubdomain">
                            You will be redirected to the new subdomain and may need to login again.
                        </li>
                        <li>
                            Any link you've shared will no longer work
                        </li>
                    </ul>
                </div>
                <form v-if="!submitting" @submit.prevent="submit" class="mt-5">
                    <div class="flex justify-start items-center">
                        <v-text-field outlined dense v-model="slug" aria-placeholder="subdomain" placeholder="subdomain" required :rules="slugRules"></v-text-field>
                        <p>{{ `.${platformHost}` }}</p>
                    </div>
                    <div class="flex justify-center">
                        <button :disabled="!validForm" :class="validForm ? 'bg-white text-black shadow-md' : 'text-gray-400'" class="rounded-full py-1 px-5 transition-all text-lg">
                            Save
                        </button>
                    </div>
                </form>
                <div v-else class="w-full flex justify-center items-center mt-3">
                    <Loading />
                </div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';

import Joi from 'joi';

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import Loading from '~/components/loaders/loading.vue';

const minLength: number = 3;

const schema = Joi.object({
    slug: Joi.string().min(minLength).regex(/^[a-zA-Z0-9-_]+$/)
});

export default Vue.extend({
    name: "EditSubdomainModal",
    props: ["showModal", "toggleModal"],
    computed: {
        validForm(): boolean {
            return schema.validate({
                slug: (this as any).slug,
            }).error ? false : true;
        }
    },
    data(): any {
        return {
            slug: null,
            slugRules: [
                (v: string) => !!v || "Subdomain is required",
                (slug: string) => !schema.validate({ slug }).error || `Subdomain not valid`,
            ],
            apiUrl: "",
            publicKey: "",
            bulletin: null,
            submitting: false,
            onSubdomain: true,
            platformHost: ""
        };
    },
    methods: {
        init() {
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
            this.slug = this.bulletin?.slug;
            this.submitting = false;
            const { host } = window.location;
            this.onSubdomain = host === this.bulletin.subdomain;
        },
        cancel() {
            this.toggleModal();
            this.init();
        },
        async submit() {
            if (!this.validForm) {
                return;
            }
            this.submitting = true;
            if (!this.bulletin) {
                return this.$router.push({
                    name: "/",
                    query: { message: `Bulletin not found` }
                });
            }
            let newSubdomain;
            let newSlug;
            try {
                const { data } = await axios.post("/api/bulletin/update-subdomain", {
                    bulletinId: this.bulletin.id,
                    slug: this.slug.toLowerCase(),
                    platformHost: this.platformHost,
                });
                newSubdomain = data.newSubdomain;
                newSlug = data.newSlug;
            }
            catch (error: any) {
                console.error(error);
                this.submitting = false;
                return this.$nuxt.$emit("toast", {
                    message: error.response.data.error || `Error updating subdomain`,
                    textColor: `text-rose-600`
                });
            }
            if (this.onSubdomain) {
                let redirectLink = `https://${newSubdomain}`;
                if (this.platformHost.includes(`localhost:`)) {
                    redirectLink = redirectLink.replace("https://", "http://");
                }
                // @ts-ignore
                return window.location = `${redirectLink}?message=subdomain updated`;
            }
            // todo uncomment
            this.$store.commit("setBulletin", {
                ...this.bulletin,
                slug: newSlug,
                subdomain: newSubdomain,
            });
            this.$nuxt.$emit("bulletin_update");
            this.toggleModal();
            setTimeout(this.init, 600);
        }
    },
    created() {
        this.init();
    },
    components: { Loading }
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