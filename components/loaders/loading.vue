<template>
    <img :style="width ? `width:${width}` : ''" src="~/assets/images/loading.gif" alt="loading gif" title="loading gif" />
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
    name: 'Loading',
    props: ['width']
});
</script>