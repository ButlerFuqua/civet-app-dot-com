<template>
    <div class="md:container md:mx-auto">
        <EditDescriptionModal :showModal="showEditDescriptionModal" :toggleModal="() => showEditDescriptionModal = !showEditDescriptionModal" />
        <EditTitleModal :showModal="showEditTitleModal" :toggleModal="() => showEditTitleModal = !showEditTitleModal" />
        <EditSubdomainModal :showModal="showEditSubdomainModal" :toggleModal="() => showEditSubdomainModal = !showEditSubdomainModal" />
        <v-list dense>
            <v-list-item-group>
                <v-list-item v-for="(item, i) in items" :key="i" @click="item.action">
                    <v-list-item-icon>
                        <v-icon v-text="item.icon"></v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title v-text="item.label"></v-list-item-title>
                        <v-list-item-subtitle>
                            {{ getSubString(item.description) }}
                        </v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list-item-group>
        </v-list>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import EditDescriptionModal from '~/components/bulletin/admin/editDescriptionModal.vue';
import EditTitleModal from '~/components/bulletin/admin/editTitleModal.vue';
import EditSubdomainModal from '~/components/bulletin/admin/editSubdomainModal.vue';
import bulletinMixinVue from '~/mixins/bulletinMixin.vue';
export default Vue.extend({
    name: "BulletinAdmin",
    layout: "bulletinAdmin",
    data(): any {
        return {
            items: [],
            bulletin: null,
            showEditDescriptionModal: false,
            showEditTitleModal: false,
            showEditSubdomainModal: false,
        };
    },
    methods: {
        init() {
            if (!process?.client) {
                return
            }
            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;
            this.bulletin = this.$store.state.bulletin;
            if (!this.bulletin) {
                return this.$router.push({
                    path: "/",
                    message: "Bulletin not found"
                });
            }
            this.items = [
                {
                    label: "Title",
                    icon: "mdi-pencil-outline",
                    description: this.bulletin.title,
                    action: () => this.showEditTitleModal = true
                },
                {
                    label: "Description",
                    icon: "mdi-pencil-outline",
                    description: this.bulletin.description,
                    action: () => this.showEditDescriptionModal = true
                },
                {
                    label: "Private",
                    icon: this.bulletin.private ? 'mdi-check' : 'mdi-close',
                    description: this.bulletin?.private ? 'Currently private' : 'Currently not private',
                    action: this.updateBulletinPrivate
                },
                {
                    label: "Subdomain",
                    icon: "mdi-pencil-outline",
                    description: this.bulletin?.subdomain,
                    action: () => this.showEditSubdomainModal = true
                },
                {
                    label: "Custom domains",
                    icon: "mdi-pencil-outline",
                    action: () => this.$router.push('/admin/domains/')
                },
                {
                    label: "Advanced",
                    icon: "mdi-pencil-outline",
                    action: () => this.$router.push('/admin/advanced/')
                },
            ];
        },
        getSubString(desc: string | undefined) {
            if (!desc) {
                return;
            }
            if (desc.length <= 33) {
                return desc;
            }
            return `${desc.substring(0, 30)}...`
        },
        async updateBulletinPrivate() {
            const errorMessage = await this.toggleBulletinPrivate(this.bulletin.id, !this.bulletin.private);
            if (errorMessage) {
                return this.$nuxt.$emit('toast', {
                    message: errorMessage,
                    textColor: `text-rose-500`,
                });
            }
            this.$store.commit('setBulletin', {
                ...this.bulletin,
                private: !this.bulletin.private
            })
            this.$nuxt.$emit('bulletin_update')
        }
    },
    created() {
        this.init();
        this.$nuxt.$on('bulletin_update', this.init);
    },
    beforeDestroy() {
        this.$nuxt.$off('bulletin_update');
    },
    components: { EditDescriptionModal, EditTitleModal, EditSubdomainModal },
    mixins: [bulletinMixinVue]
});
</script>