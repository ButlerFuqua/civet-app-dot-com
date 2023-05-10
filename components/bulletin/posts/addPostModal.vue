<template>
    <v-dialog v-model="showModal" fullscreen :scrim="false" transition="dialog-bottom-transition">
        <v-card tile>
            <v-toolbar dark color="primary">
                <v-btn icon dark @click="toggleModal()">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Add Post</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn color="white" text @click="toggleModal()">
                        Save
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
    name: "AddPostModal",
    props: ['showModal', 'toggleModal'],
    data() {
        return {
            notifications: false,
            sound: true,
            widgets: false,
        }
    },
})

</script>

<style lang="scss" scoped>
.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
    transition: transform .2s ease-in-out;
}
</style>