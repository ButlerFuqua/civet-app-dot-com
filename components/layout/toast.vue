<template>
    <div class="text-center ma-2 toast">
        <v-snackbar v-model="snackbar">
            <div :class="`${textColor}`" class="p-1 flex justify-between">
                {{ message }}
                <button v-if="!hideClose" @click="snackbar = false">
                    <CloseIcon />
                </button>
            </div>
        </v-snackbar>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

import CloseIcon from '../icons/closeIcon.vue';

export type ToastPayload = {
    message: string
    textColor?: string
    hideClose?: boolean
}

export default Vue.extend({
    data: () => ({
        snackbar: false,
        message: `Howdy`,
        textColor: 'text-teal-300',
        hideClose: false
    }),
    created() {
        this.$nuxt.$on('toast', ({ message, textColor, hideClose }: ToastPayload) => {
            this.message = message;
            this.textColor = textColor || this.textColor;
            this.hideClose = hideClose ?? this.hideClose;
            this.snackbar = true;
        })
    },
    beforeDestroy() {
        // doesn't come back if this is here
        // this.$nuxt.$off('toast');
    },
    components: { CloseIcon }
});
</script>

<style lang="scss" scoped>
.toast {
    max-width: 100%;
}
</style>