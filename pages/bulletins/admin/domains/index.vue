<template>
    <div class="md:container md:mx-auto">
        <ErrorMessage v-if="errorMessage" :errorMessage="errorMessage" :removeErrorMessage="() => errorMessage = null" />
        <AddDomainModal :showModal="showAddDomainModal" :toggleModal="() => showAddDomainModal = !showAddDomainModal" :getDomains="getDomains" />
        <ManageDomainModal :showModal="showManageDomainModal && selectedDomain" :toggleModal="() => showManageDomainModal = !showManageDomainModal" :getDomains="getDomains" :domain="selectedDomain" />

        <div class="flex justify-center items-center my-3">
            <button class="text-amber-500 hover:text-amber-400 transition-all" @click="showAddDomainModal = true">Add custom domain</button>
        </div>

        <!-- No domains -->
        <div v-if="!domains?.length">
            You have no custom domains for this bulletin. Click "Add Custom Domain" to add one.
        </div>

        <v-list v-if="domains && domains.length" dense>
            <v-list-item-group>
                <v-list-item v-for="(domain, i) in domains" :key="i" @click="initEditDomain(domain)">
                    <v-list-item-content>
                        <v-list-item-title>{{ getSubString(domain.name) }}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list-item-group>
        </v-list>

        <!-- Skeleton loader -->
        <div v-else-if="!domains" class="flex justify-center items-center">
            <Loading />
        </div>

    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import AddDomainModal from '~/components/bulletin/admin/addDomainModal.vue';
import ManageDomainModal from '~/components/bulletin/admin/manageDomainModal.vue';
import CloseIcon from '~/components/icons/closeIcon.vue';
import ErrorMessage from '~/components/layout/errorMessage.vue';
import Loading from '~/components/loaders/loading.vue';
import bulletinMixinVue from '~/mixins/bulletinMixin.vue';
export default Vue.extend({
    name: "BulletinAdmin",
    layout: "bulletinAdmin",
    data(): any {
        return {
            domains: null,
            bulletin: null,
            showEditDescriptionModal: false,
            showEditTitleModal: false,
            showAddDomainModal: false,
            showManageDomainModal: false,
            apiUrl: '',
            publicKey: '',
            errorMessage: null,
            loading: true,
            selectedDomain: null
        };
    },
    methods: {
        async init() {
            if (!process?.client) {
                return;
            }
            this.getCreds();
            this.bulletin = this.$store.state.bulletin;
            if (!this.bulletin) {
                return this.$router.push({
                    path: "/admin",
                    message: "Bulletin not found"
                });
            }
            await this.getDomains();
        },
        getCreds() {
            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;
        },
        getSubString(str: string | undefined) {
            if (!str) {
                return;
            }
            if (str.length <= 33) {
                return str;
            }
            return `${str.substring(0, 30)}...`
        },
        async getDomains() {

            const { domains, error } = await this.getBulletinDomains(this.bulletin.id);

            if (error) {
                this.$nuxt.$emit('toast', {
                    message: error,
                    textColor: `text-rose-600`
                });
                this.errorMessage = error;
                this.loading = false;
                return;
            }

            this.domains = domains || [];
        },
        initEditDomain(domain: { id: string, bulletin_id: string, name: string }) {
            this.selectedDomain = domain;
            this.showManageDomainModal = true
        }
    },
    async created() {
        await this.init();
        this.$nuxt.$on('bulletin_update', this.init);
    },
    beforeDestroy() {
        this.$nuxt.$off('bulletin_update');
    },
    components: { AddDomainModal, CloseIcon, ErrorMessage, ManageDomainModal, Loading },
    mixins: [bulletinMixinVue]
});
</script>