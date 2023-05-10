<template>
    <v-dialog v-model="showModal" fullscreen :scrim="false" transition="dialog-bottom-transition">
        <v-card v-if="notification" tile>
            <v-toolbar dark color="primary">
                <v-btn icon dark @click="close()">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>{{ notification.label }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn color="white" text @click="close">
                        Close
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <div class="container mx-auto">
                <p>{{ notification.description }}</p>
                <p v-if="notification.link"><a :href="notification.link">View</a></p>
                <button @click="deleteNotification">Delete Notification</button>
            </div>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import userMixinVue from '~/mixins/userMixin.vue';

export default Vue.extend({
    name: "ViewNotificationModal",
    props: ['showModal', 'toggleModal', 'notification', 'removeNotificationFromParent'],
    data(): any {
        return {
        }
    },
    watch: {
        async notification() {
            if (!this.notification?.seen && this.notification?.id) {
                await this.markNotificationAsSeen(this.notification.id);
            }
        }
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
        },
        close() {
            this.toggleModal();
            // this.init();
        },
        async deleteNotification() {
            const response = await this.removeNotificationById(this.notification.id);
            if (response?.error) {
                console.error(response?.error);
                return this.$nuxt.$emit('toast', {
                    message: response?.error,
                    TextColor: `text-rose500`
                })
            }
            this.removeNotificationFromParent(this.notification.id)
            this.close();
        }
    },
    async created() {
        this.init();
    },
    mixins: [userMixinVue]
});
</script>

<style lang="scss" scoped>
.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
    transition: transform .2s ease-in-out;
}
</style>