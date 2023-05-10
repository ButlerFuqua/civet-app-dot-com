<template>
    <div class="w-full my-3 post-thumb">
        <!-- Chip section -->
        <div class="flex justify-between items-center">
            <div class="flex mb-1 px-2">
                <span v-if="post.author_id === ownerId" class="mr-2">owner</span>
            </div>
            <!-- edit chips -->
            <div v-if="post.author_id === currentUserId" class="flex mb-1 px-2 justify-end">
                <button @click="$router.push(`/posts/edit?id=${post.id}`)" class="text-blue-500 mr-2">Edit</button>
            </div>
        </div>
        <!-- <v-divider></v-divider> -->
        <v-card dark app tile>

            <!-- Username section -->
            <div class="p-3 flex items-center justify-between">
                <div class="flex items-center ">
                    <img class="rounded-full w-10" src="https://picsum.photos/200" alt="User Avatar" title="User Avatar">
                    <span class="ml-2">{{ post.username }}</span>
                </div>
                <button @click="$router.push(`/posts/${post.id}`)" :class="currentUserCommentedOnPost ? 'text-purple-500' : 'text-gray-400'">Comments ({{ post.comment_count }})</button>
                <!-- <button @click="$router.push(`/posts/${post.id}`)" :class="currentUserCommentedOnPost ? 'text-purple-500' : 'text-gray-400'">Comments ({{ post.comments.length }})</button> -->
            </div>
            <v-divider></v-divider>

            <!-- Post content -->
            <!-- ex -> :class="anon_post ? 'border-purple-700' : ''" -->
            <div :class="!post.media_url ? 'border-l-2' : ''" class="p-3 text-lg post_body">{{ getPostBodySubString(post.body) }}</div>

            <!-- Post image -->
            <div class="w-full bg-white" v-if="post.media_url && post.media_type.includes('image')">
                <img :src="post.media_url" alt="Image included in post">
            </div>
            <video class="w-full" v-if="post.media_url && post.media_type.includes('video')" controls controlsList="nodownload">
                <source v-if="post.media_type === 'video/mp4'" :src="post.media_url" type="video/mp4">
                <source v-else :src="post.media_url">
                Your browser does not support the video tag.
            </video>

            <v-divider></v-divider>

            <!-- Post actions -->
            <div class="p-3 flex items-center flex-wrap justify-between">
                <button :disabled="submittingLike" @click="submitLikeToggle" :class="currentUserLikedPost ? 'text-amber-500' : 'text-gray-400'">Like ({{ likeCount }})</button>
                <button @click="$router.push(`/posts/${post.id}`)" class="text-purple-500">View/Comment</button>
            </div>

        </v-card>
    </div>
</template>

<script  lang="ts">
import Vue from 'vue';

import postMixinVue from '~/mixins/postMixin.vue';

export default Vue.extend({
    name: 'PostThumb',
    props: ['post', 'ownerId', 'bulletinId', 'currentUserId'],
    data(): any {
        return {
            authorData: null,
            submittingLike: false,
            likeCount: 0
        }
    },
    computed: {
        currentUserLikedPost(): boolean {
            // return this.post.likes.includes(this.currentUserId)
            return false;
        },
        currentUserCommentedOnPost(): boolean {
            return false
            // return this.post.comment_authors.includes(this.currentUserId)
        },
    },
    methods: {
        async init() {
            if (!process?.client) {
                return;
            }
            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;

            await this.getReactions();
        },
        getPostBodySubString(postBody: string): string {
            const body = postBody.trim();
            const limit = 500;
            if (body.length <= 500) {
                return body;
            }
            return `${postBody.substring(0, limit - 3)}...`;
        },
        async getReactions() {
            const { error, likes } = await this.getPostReactionsById(this.post.id);
            if (error) {
                console.error(error);
            }
            this.likeCount = likes.length;
        },
        async submitLikeToggle() {
            this.submittingLike = true;
            const data = {
                profileId: this.currentUserId,
                bulletinId: this.bulletinId,
                entityId: this.post.id,
                username: this.$store.state.profile.username,
                postAuthorId: this.post.author_id
            }


            const { count, error } = await this.toggleLikesPost(data);
            if (error) {
                this.submittingLike = false;
                return this.$nuxt.$emit('toast', {
                    message: error,
                    textColor: `text-rose-500`
                });
            }

            this.likeCount += count;
            this.submittingLike = false;


            // if (!this.post.likes.includes(this.currentUserId)) {
            //     const response = await this.addLikeToPost(data);
            //     if (error) {
            //         this.submittingLike = false;
            //         return this.$nuxt.$emit('toast', {
            //             message: response.error,
            //             textColor: `text-rose-500`
            //         });
            //     }

            //     this.post.likes = [...this.post.likes, this.currentUserId];
            //     this.submittingLike = false;
            // } else {
            //     const response = await this.removeLikeFromPost(data);
            //     if (response?.error) {
            //         this.submittingLike = false;
            //         return this.$nuxt.$emit('toast', {
            //             message: response.error,
            //             textColor: `text-rose-500`
            //         });
            //     }

            //     this.post.likes = this.post.likes.filter((id: string) => id !== this.currentUserId);
            //     this.submittingLike = false;
            // }
        }
    },
    async created() {
        await this.init();
        console.log('this.post', this.post)
    },
    components: {},
    mixins: [postMixinVue]
})
</script>

<style lang="scss" scoped>

</style>