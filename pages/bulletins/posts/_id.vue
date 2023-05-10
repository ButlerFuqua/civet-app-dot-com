<template>
    <v-app v-if="post" dark>
        <Toast />
        <v-app-bar fixed app v-if="!loading">
            <button @click="$router.push('/')">
                Bulletin
            </button>
            <v-spacer />
            <v-toolbar-title>Post to bulletin</v-toolbar-title>
            <v-spacer />
            <button :disabled="submittingLike" @click="submitLikeToggle" :class="currentUserLikedPost ? 'text-amber-500' : 'text-gray-400'">Like ({{ post.likes.length }})</button>
        </v-app-bar>
        <v-main class="h-full">

            <!-- Post content -->
            <!-- ex -> :class="anon_post ? 'border-purple-700' : ''" -->
            <div class="p-3 text-lg post_body">{{ post.body.trim() }}</div>
            <v-divider class="mt-2 mb-3"></v-divider>

            <!-- Comments -->
            <div v-if="postComments">
                <CommentThumb v-for="comment in postComments" :key="comment.id" :comment="comment" />
            </div>
        </v-main>

        <!-- User nav -->
        <v-navigation-drawer v-model="userDrawer" app right>
            <v-list>
                <v-list-item>
                    <v-list-item-action>
                        <v-icon>mdi-pencil-outline</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Profile</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <!-- User bar -->
        <v-app-bar fixed app bottom v-if="!loading">
            <form @submit.prevent="submitPostComment" class="w-full h-full flex p-1">
                <input class="h-full w-full rounded-full bg-white px-2 py-1 text-black" type="text" placeholder="Comment..." v-model="postComment" />
                <button class="ml-1 p-1 text-purple-500">Submit</button>
            </form>
        </v-app-bar>
    </v-app>
    <v-app dark v-else>
        <div class="h-full flex justify-center items-center p-3">
            <Loading />
        </div>
    </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import Joi from 'joi'
import Toast from '~/components/layout/toast.vue';
import Loading from '~/components/loaders/loading.vue';
import bulletinMixinVue from '~/mixins/bulletinMixin.vue';
import userMixinVue from '~/mixins/userMixin.vue';
import postMixinVue from '~/mixins/postMixin.vue';
import commentMixinVue from '~/mixins/commentMixin.vue';
import CloseIcon from '~/components/icons/closeIcon.vue';
import CommentThumb from '~/components/bulletin/comments/commentThumb.vue';

const schema = Joi.object({
    comment: Joi.string().min(3),
});

export default Vue.extend({
    name: "AddPost",
    data(): any {
        return {
            userDrawer: false,
            bulletin: null,
            userProfile: null,
            loading: true,
            postBody: '',
            mediaInput: null,
            mediaFile: null,
            post: null,
            submittingLike: false,
            postComment: '',
            postComments: null
        };
    },
    computed: {
        currentUserLikedPost(): boolean {
            return this.post.likes.includes(this.currentUserId)
        },
        currentUserCommentedOnPost(): boolean {
            return this.post.comment_authors.includes(this.currentUserId)
        },
        validForm(): boolean {
            const error = schema.validate({
                comment: (this as any).comment?.trim(),
            }).error
            return error ? false : true;
        }
    },
    methods: {
        async init() {
            this.loading = true;
            if (!process?.client) {
                return;
            }
            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;

            this.userProfile = this.$store.state.profile;
            if (!this.userProfile) {
                const { error: getUserError } = await this.getCurrentUser();
                if (getUserError) {
                    return this.$router.push({
                        path: '/login',
                        query: { message: getUserError, color: `text-rose-600` }
                    });
                }

                const getProfileError = await this.getProfile();
                if (getProfileError) {
                    return this.$router.push({
                        path: '/login',
                        query: { message: getProfileError, color: `text-rose-600` }
                    });
                }
            }

            const bulletin = this.$store.state.bulletin ?? await this.getBulletinBySlug();
            if (!bulletin) {
                return this.$router.push({
                    path: '/login',
                    query: { message: `Error getting bulletin`, color: `text-rose-600` }
                });
            }
            this.$store.commit("setBulletin", bulletin);

            this.bulletin = bulletin;
            this.$nuxt.$emit("bulletin_update");

            await this.getPost();
            await this.getComments();

            this.loading = false;
        },
        toggleSelectMediaFile() {
            if (this.mediaFile) {
                this.mediaFile = null;
                this.mediaInput = null;
                return;
            }
            this.mediaInput = this.mediaInput || document.createElement('input');
            this.mediaInput.type = 'file';
            this.mediaInput.accept = 'video/*,image/*'
            this.mediaInput.click();
            this.mediaInput.addEventListener('change', (event: Event) => {
                this.mediaFile = this.mediaInput.files[0];
            })
        },
        async getProfile(): Promise<void | string> {
            const { userProfile, error: getProfileError } = await this.getUserProfile();
            if (getProfileError || !userProfile) {
                return getProfileError?.message || `Error getting user profile.`
            }
            this.$store.commit("setProfile", userProfile);
            this.userProfile = userProfile;
        },
        async getPost() {
            const { id } = this.$route.params;
            if (!id) {
                return this.$router.push({
                    path: `/`,
                    message: `No id provided to view post`,
                });
            }
            const { error, post } = await this.getPostWithAuthorAndCommentData(id);
            if (error) {
                console.error(error);
                return this.$router.push({
                    path: `/`,
                    message: error,
                });
            }
            this.post = {
                ...post,
                likes: post.likes.split(',').filter((like: string) => like != ''),
                comments: post.comments.split(',').filter((comment: string) => comment != ''),
            };
        },
        async getComments() {
            if (!this.post?.id) {
                return this.$router.push({
                    path: `/`,
                    message: `No post ID found.`
                });
            }

            const { comments, error } = await this.getCommentsByPostId(this.post.id);
            if (error) {
                return this.$router.push({
                    path: `/`,
                    message: error
                });
            }

            this.postComments = comments;

        },
        async submitLikeToggle() {
            this.submittingLike = true;
            const data = {
                profileId: this.$store.state.profile.id,
                bulletinId: this.bulletin.id,
                entityId: this.post.id,
            }
            if (!this.post.likes.includes(this.currentUserId)) {
                const response = await this.addLikeToPost(data);
                if (response?.error) {
                    this.submittingLike = false;
                    return this.$nuxt.$emit('toast', {
                        message: response.error,
                        textColor: `text-rose-500`
                    });
                }
                this.post.likes = [...this.post.likes, this.currentUserId];
                this.submittingLike = false;
            } else {
                const response = await this.removeLikeFromPost(data);
                if (response?.error) {
                    this.submittingLike = false;
                    return this.$nuxt.$emit('toast', {
                        message: response.error,
                        textColor: `text-rose-500`
                    });
                }

                this.post.likes = this.post.likes.filter((id: string) => id !== this.currentUserId);
                this.submittingLike = false;
            }
        },
        async submitPostComment() {
            if (!this.validForm) {
                return this.$nuxt.$emit('toast', {
                    message: `Post not valid`,
                    textColor: `text-rose-500`
                });
            }

            // this.loading = true;

            const response = await this.createComment({
                authorId: this.userProfile.id,
                bulletinId: this.bulletin.id,
                parentId: this.post.id,
                parentType: 'post',
                body: this.postComment,
                allowComments: true
            });

            if (response?.error) {
                this.loading = false;
                return this.$nuxt.$emit('toast', {
                    message: response.error,
                    textColor: `text-rose-500`
                });
            }

            this.$nuxt.$emit('toast', {
                message: 'Comment added!',
            });

            this.post.comments.push(this.userProfile.id);

            this.postComment = '';

            await this.getComments();

            // this.loading = false;

        }
    },
    async created() {
        await this.init();
    },
    beforeDestroy() {
    },
    components: { Toast, Loading, CloseIcon, CommentThumb },
    mixins: [bulletinMixinVue, userMixinVue, postMixinVue, commentMixinVue]
})
</script>

<style lang="scss" >
textarea {
    min-height: 50vh !important;
    padding: .5rem !important;
}
</style>
  