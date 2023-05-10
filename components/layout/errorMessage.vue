<template>
    <div v-if="errorMessage" class="bg-rose-600 p-3 rounded flex items-center justify-between">
        <p>{{ errorMessage }}</p>
        <button @click="removeErrorMessage">
            <CloseIcon />
        </button>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CloseIcon from '../icons/closeIcon.vue';

export default Vue.extend({
    name: "ErrorMessageAlert",
    props: ["errorMessage", "removeErrorMessage"],
    components: { CloseIcon }
})
</script>