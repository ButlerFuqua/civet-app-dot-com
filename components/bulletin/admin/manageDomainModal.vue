<template>
    <v-dialog v-model="showModal" fullscreen :scrim="false" transition="dialog-bottom-transition">
        <v-card v-if="domain" tile>
            <v-toolbar dark color="primary">
                <v-btn icon dark @click="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Manage {{ domain.name }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn color="white" text @click="cancel">
                        Cancel
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <div class="container mx-auto">
                <ErrorMessage v-if="errorMessage" :errorMessage="errorMessage" :removeErrorMessage="() => errorMessage = null" />
                <div v-if="!submitting">

                    <!-- Check domain configuration -->
                    <div class="flex items-center justify-between">
                        <h2 class="mt-3 text-2xl">Check Domain Configuration</h2>
                        <button @click="getConfigs" class="text-amber-500 transition-all hover:text-amber-300 hover:underline font-semibold">Check</button>
                    </div>

                    <!-- result from check domain config -->
                    <div v-if="configuredCorrectly !== null">
                        <div :class="configuredCorrectly ? 'bg-green-600 text-white' : 'bg-red-600 text-white'" class="p-3 mt-3 rounded flex items-center justify-between">
                            <div>
                                <p class="text-xl mt-2">
                                    {{ configuredCorrectly ? 'Configured Correctly!' : 'Not configured correctly' }}
                                </p>
                            </div>
                            <button @click="configuredCorrectly = null">
                                <CloseIcon />
                            </button>
                        </div>
                    </div>
                    <v-divider class="mt-3 mb-4"></v-divider>

                    <!-- Remove domain -->
                    <div class="flex items-center justify-between">
                        <h2 class="mt-3 text-2xl">Remove domain</h2>
                        <button @click="askAgain = !askAgain" :class="!askAgain ? 'text-rose-500 hover:text-rose-300' : 'text-blue-500 hover:text-blue-300'" class="transition-all hover:underline font-semibold">
                            {{ !askAgain ? 'Remove' : 'Never Mind' }}
                        </button>
                    </div>

                    <div v-if="askAgain" class="mt-3 text-center border border-red-500 rounded p-2">
                        <h3 class="text-xl">Are you sure?</h3>
                        <button @click="deleteForReal" class="my-3 rounded-full font-black text-white-600 hover:text-red-500 py-1 px-3 hover:bg-white text-white bg-red-500 transition-all">Remove from Bulletin</button>
                        <p><span class="text-amber-500 font-black">Note:</span> Removing the domain here does not delete it from where you've registered it.</p>
                    </div>
                    <v-divider class="mt-3 mb-4"></v-divider>
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

export default Vue.extend({
    name: "ManageDomainModal",
    props: ["showModal", "toggleModal", "getDomains", "domain"],
    data(): any {
        return {
            apiUrl: "",
            publicKey: "",
            bulletin: null,
            submitting: false,
            platformHost: "",
            platformUrl: "",
            configuredCorrectly: null,
            errorMessage: null,
            askAgain: false
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
            this.askAgain = false;
            this.platformUrl = `https://${this.platformHost}`;
            if (this.platformHost.includes("localhost:")) {
                this.platformUrl = this.platformUrl.replace("https://", "http://");
            }
            this.configuredCorrectly = null;
        },
        cancel() {
            this.toggleModal();
            this.init();
        },
        async deleteForReal() {
            this.submitting = true
            const response = await this.deleteCustomDomain({
                name: this.domain.name,
                userId: this.$store.state.profile.id
            });
            if (response?.error) {
                this.errorMessage = response.error;
                this.submitting = false;
            }

            await this.getDomains();

            this.cancel();
        },
        async getConfigs() {
            this.submitting = true;
            const { configuredCorrectly, error } = await this.getCustomDomainConfigs({
                userId: this.$store.state.profile.id,
                name: this.domain.name,
            });
            if (error) {
                this.errorMessage = error;
            }
            this.configuredCorrectly = !error ? configuredCorrectly : null;
            this.submitting = false;
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