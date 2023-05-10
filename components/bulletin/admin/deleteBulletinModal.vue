<template>
    <v-dialog v-model="showModal" fullscreen :scrim="false" transition="dialog-bottom-transition">
        <v-card tile>
            <v-toolbar dark color="red">
                <v-btn icon dark @click="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Delete Bulletin</v-toolbar-title>
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
                    <p>No one will be able to use this bulletin anymore :(</p>
                </div>
                <div v-if="!submitting" @submit.prevent="submit" class="mt-5">
                    <p class="my-3">Type the title of the bulletin to confirm delete: <span class="font-semibold">{{ bulletin.title }}</span></p>
                    <v-text-field outlined dense v-model="deleteConfirmation" aria-placeholder="Type Bulletin title to delete" :placeholder="bulletin.title" required></v-text-field>
                    <div class="flex justify-center">
                        <button @click="submit" :disabled="!validForm" :class="validForm ? 'bg-white text-black shadow-md' : 'text-gray-400'" class="rounded-full py-1 px-5 transition-all text-lg">
                            Save
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


export default Vue.extend({
    name: "DeleteBulletinModal",
    props: ["showModal", "toggleModal",],
    computed: {
        validForm(): boolean {
            return this.deleteConfirmation === this.$store.state.bulletin.title
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
            deleteConfirmation: null
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
            const { id, email } = this.$store.state.profile;
            const response = await this.handleDeleteBulletin({
                bulletinId: this.bulletin.id.trim(),
                userId: id,
                email
            });
            if (response?.error) {
                this.errorMessage = response.error;
                this.submitting = false;
                return;
            }

            window.location = this.platformUrl;
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