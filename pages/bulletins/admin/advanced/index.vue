<template>
    <div class="container mx-auto">

        <DeleteBulletinModal :showModal="showDeleteModal" :toggleModal="() => showDeleteModal = !showDeleteModal" />
        <RemoveUserModal :showModal="showRemoveUserModal" :toggleModal="() => showRemoveUserModal = !showRemoveUserModal" />
        <BanUserModal :showModal="showBanUserModal" :toggleModal="() => showBanUserModal = !showBanUserModal" />
        <UnBanUserModal :showModal="showUnBanUserModal" :toggleModal="() => showUnBanUserModal = !showUnBanUserModal" />

        <h2 class="text-2xl text-center">Advanced settings</h2>
        <v-divider class="my-3"></v-divider>
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
import BanUserModal from '~/components/bulletin/admin/banUserModal.vue';
import DeleteBulletinModal from '~/components/bulletin/admin/deleteBulletinModal.vue';
import RemoveUserModal from '~/components/bulletin/admin/removeUserModal.vue';
import UnBanUserModal from '~/components/bulletin/admin/unBanUserModal.vue';
import CloseIcon from '~/components/icons/closeIcon.vue';
export default Vue.extend({
    name: "AdvancedSettings",
    layout: "bulletinAdmin",
    data(): any {
        return {
            showRemoveUserModal: false,
            showBanUserModal: false,
            showDeleteModal: false,
            showUnBanUserModal: false,
            items: []
        };
    },
    methods: {
        init() {
            if (!this.$store.state.bulletin) {
                return this.$router.push({
                    path: '/',
                    query: {
                        message: 'Bulletin not found in settings.'
                    }
                });
            }
            this.items = [
                {
                    label: "Remove User",
                    icon: 'mdi-account-off-outline',
                    description: `User may join again.`,
                    action: () => this.showRemoveUserModal = true
                },
                {
                    label: "Ban User",
                    icon: 'mdi-account-lock-outline',
                    description: `User cannot rejoin.`,
                    action: () => this.showBanUserModal = true
                },
                {
                    label: "Un-ban User",
                    icon: 'mdi-account-lock-outline',
                    description: `User may be able to join again.`,
                    action: () => this.showUnBanUserModal = true
                },
                {
                    label: "Delete bulletin",
                    icon: 'mdi-close',
                    description: `Don't do it...`,
                    action: () => this.showDeleteModal = true
                },
            ]
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
    },
    created() {
        this.init();
    },
    components: { CloseIcon, DeleteBulletinModal, RemoveUserModal, BanUserModal, UnBanUserModal }
})
</script>