<template>
    <div v-if="!loading">

        <!-- Show notification -->
        <ViewNotificationModal :showModal="showViewNotificationModal" :toggleModal="closeViewNotification" :notification="selectedNotification" :removeNotificationFromParent="removeNotification" />

        <v-list v-if="notifications.length" dense>
            <v-list-item-group>
                <v-list-item v-for="(notification, i) in notifications" :key="i" @click="showViewNotification(notification)">
                    <v-list-item-icon>
                        <v-icon v-text="notification.icon"></v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title v-text="notification.label"></v-list-item-title>
                        <v-list-item-subtitle>
                            {{ notification.description }}
                        </v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list-item-group>
        </v-list>
        <div v-else class="p-3 text-center">
            <p>No notifications at this time</p>
        </div>
    </div>
    <div v-else class="h-full flex justify-center items-center">
        <Loading />
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import userMixinVue from '~/mixins/userMixin.vue';
import Loading from '~/components/loaders/loading.vue';
import ViewNotificationModal from '~/components/userSpace/viewNotificationModal.vue'
export default Vue.extend({
    name: 'NotificationsPage',
    layout: 'userSpace',
    data(): any {
        return {
            notifications: [],
            bulletin: null,
            userProfile: null,
            loading: false,
            showViewNotificationModal: false,
            selectedNotification: null
        };
    },
    methods: {
        async init() {
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

            this.userProfile = this.$store.state.profile;
            if (!this.userProfile) {
                return this.$router.push({
                    path: "/",
                    message: "User profile not found"
                });
            }

            await this.getNotifications();

        },
        async getNotifications() {
            this.loading = true;

            const { notifications, error } = await this.getUserNotifications(this.userProfile.id);

            if (error) {
                this.$nuxt.$emit('toast', {
                    message: error,
                    textColor: `text-rose-500`
                })
            }

            this.notifications = notifications || [];

            this.loading = false;
        },
        removeNotification(idToRemove: string) {
            setTimeout(() => this.notifications = this.notifications.filter(({ id }: any) => id !== idToRemove), 600)
        },
        showViewNotification(notification: any) {
            console.log('notification', notification)
            this.selectedNotification = notification;
            this.showViewNotificationModal = true;
        },
        closeViewNotification() {
            this.showViewNotificationModal = false;
            this.selectedNotification = null
        },
        async deleteNotification(idToDelete: string) {
            const { error } = await this.removeNotificationById(idToDelete);

            if (error) {
                return this.$nuxt.$emit('toast', {
                    message: error,
                    textColor: `text-rose-500`
                });
            }

            this.notifications = this.notifications.filter(({ id }: any) => id !== idToDelete);
        }
    },
    async created() {
        await this.init();
    },
    components: { Loading, ViewNotificationModal },
    mixins: [userMixinVue],
});
</script>