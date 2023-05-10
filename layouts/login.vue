<template>
    <div>
        <Toast />
        <nuxt />
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Toast from '~/components/layout/toast.vue';
export default Vue.extend({
    name: "LoginLayout",
    components: { Toast }
})
</script>