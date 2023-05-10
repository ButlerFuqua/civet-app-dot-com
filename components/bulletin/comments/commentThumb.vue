<template>
    <div v-if="comment" class="flex my-3 p-2" :class="isUserComment ? 'justify-start ml-2' : 'justify-end mr-2'">
        <div class="comment">
            <!-- Comment author -->
            <div class="flex items-center mb-2">
                <img class="rounded-full" src="https://picsum.photos/200" alt="User Avatar" title="User Avatar">
                <span class="ml-2">{{ comment.username }}</span>
            </div>

            <!-- Comment body -->
            <div class="comment_body p-2 pl-3 bg-gray-200 text-black rounded">{{ comment.body }}</div>

            <!-- Actions -->
            <div class="flex justify-between items-center">
                <!-- not mvp -->
                <!-- <button>Like</button> -->
                <div class="text-sm my-2">{{ getFriendlyDateString(comment.created_at) }}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getFriendlyDateString } from '../../../utils/string.utils';
export default Vue.extend({
    name: 'CommentThumb',
    props: ['comment'],
    computed: {
        isUserComment(): boolean {
            return this.comment.author_id === this.$store.state.profile?.id;
        }
    },
    methods: {
        getFriendlyDateString,
    }
});
</script>

<style lang="scss" scoped>
img {
    width: 2rem;
}

.comment {
    min-width: 50%;
    max-width: 90%;
}
</style>