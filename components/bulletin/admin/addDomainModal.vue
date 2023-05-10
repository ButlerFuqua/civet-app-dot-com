<template>
    <v-dialog v-model="showModal" fullscreen :scrim="false" transition="dialog-bottom-transition">
        <v-card tile>
            <v-toolbar dark color="primary">
                <v-btn icon dark @click="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Edit domain</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn color="white" text @click="cancel">
                        Cancel
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <div class="container mx-auto">
                <ErrorMessage v-if="errorMessage" :errorMessage="errorMessage" :removeErrorMessage="() => errorMessage = null" />
                <div class="mt-5">
                    <h2 class="text-amber-500 font-black text-3xl">Important!</h2>
                    <p>After adding a domain here, you must also register it with a domain register such as GoDaddy or NameCheap.</p>
                    <p>Read <a :href="`${platformUrl}/custom-domains`">this article</a> to learn how to register and connect your domain after adding it here.</p>
                    <p>By submitting below you confirm that you have <span class="text-amber-500 font-semibold">ownership of the domain</span> that you are requesting.</p>
                </div>
                <form v-if="!submitting" @submit.prevent="submit" class="mt-5">
                    <div class="flex justify-start items-center">
                        <p>https://www.</p>
                        <v-text-field outlined dense v-model="domain" aria-placeholder="domain" placeholder="whatever.com" required :rules="domainRules"></v-text-field>
                    </div>
                    <p>
                        <small>
                            Include any TLD such as: ".com", ".org", etc.
                        </small>
                    </p>
                    <div class="flex justify-center">
                        <button :disabled="!validForm" :class="validForm ? 'bg-white text-black shadow-md' : 'text-gray-400'" class="rounded-full py-1 px-5 transition-all text-lg">
                            Save
                        </button>
                    </div>
                </form>
                <div v-else class="flex justify-center items-center">
                    <Loading />
                </div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';

import Joi from 'joi';
import Loading from '~/components/loaders/loading.vue';
import CloseIcon from '~/components/icons/closeIcon.vue';
import ErrorMessage from '~/components/layout/errorMessage.vue';
import bulletinMixinVue from '~/mixins/bulletinMixin.vue';

const schema = Joi.object({
    domain: Joi.string().uri().min(9),
});

export default Vue.extend({
    name: "EditDomainModal",
    props: ["showModal", "toggleModal", "getDomains"],
    computed: {
        validForm(): boolean {
            const error = schema.validate({
                domain: `https://${(this as any).domain?.trim()}`,
            }).error
            return error ? false : true;
        }
    },
    data(): any {
        return {
            domain: null,
            domainRules: [
                (v: string) => !!v || "Domain is required",
                (domain: string) => !schema.validate({ domain: `https://${domain}` }).error || `Domain not valid`,
            ],
            apiUrl: "",
            publicKey: "",
            bulletin: null,
            submitting: false,
            platformHost: "",
            platformUrl: "",
            errorMessage: null,
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
            this.submitting = false;
            this.platformUrl = `https://${this.platformHost}`;
            if (this.platformHost.includes("localhost:")) {
                this.platformUrl = this.platformUrl.replace("https://", "http://");
            }
            this.domain = null;
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

            const response = await this.addCustomDomain({
                bulletinId: this.bulletin.id.trim(),
                userId: this.$store.state.profile.id.trim(),
                name: this.domain.trim(),
            });
            if (response?.error) {
                this.errorMessage = response.error;
                this.submitting = false;
                return;
            }

            await this.getDomains();

            this.toggleModal();
            setTimeout(this.init, 600);
        }
    },
    created() {
        this.init();
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