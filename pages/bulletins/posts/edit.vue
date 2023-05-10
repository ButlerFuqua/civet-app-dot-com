<template>
    <v-app dark v-if="post">
        <Toast />
        <v-app-bar fixed app color="primary" v-if="!loading">
            <button @click="$router.push('/')">
                Cancel
            </button>
            <v-spacer />
            <v-toolbar-title>Post to bulletin</v-toolbar-title>
            <v-spacer />
            <button :class="validForm ? 'text-black bg-white py-2 px-3 rounded-full shadow' : 'text-gray-300'" class="transition-all" @click="submit">
                Submit
            </button>
        </v-app-bar>
        <v-main class="h-full">

            <div v-if="!loading" class="h-full">
                <v-textarea v-model="postBody" aria-placeholder="Add post here" placeholder="Add post here...">

                </v-textarea>
            </div>
            <div v-else class="flex justify-center items-center h-full">
                <Loading />
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
            <div class="flex justify-around">
                <button @click="toggleSelectMediaFile" class="p-1 flex" :class="mediaFile || mediaUrl ? 'text-rose-500' : ''">
                    <CloseIcon v-if="mediaFile || mediaUrl" />image/Video
                </button>
            </div>
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
import CloseIcon from '~/components/icons/closeIcon.vue';

const schema = Joi.object({
    postBody: Joi.string().min(3),
});

export default Vue.extend({
    name: "EditPost",
    data(): any {
        return {
            userDrawer: false,
            bulletin: null,
            userProfile: null,
            loading: false,
            postBody: '',
            mediaInput: null,
            mediaFile: null,
            post: null,
            postId: null,
            mediaUrl: null,
            removeMedia: false,
            updateMedia: false
        };
    },
    computed: {
        validForm(): boolean {
            const error = schema.validate({
                postBody: (this as any).postBody?.trim(),
            }).error
            return error ? false : true;
        }
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

            // Get id of post to edit
            const { id } = this.$route.query
            this.postId = id;
            await this.getPost();

            // insert post data
            this.insertPostData()

            this.bulletin = this.$store.state.bulletin;
            if (!this.bulletin) {
                return this.$router.push({
                    path: '/login',
                    query: { message: `Error getting bulletin`, color: `text-rose-600` }
                });
            }

            this.userProfile = this.$store.state.profile;
            if (!this.userProfile) {
                return this.$router.push({
                    path: '/login',
                    query: { message: `User not found`, color: `text-rose-600` }
                });
            }

        },
        async getPost() {
            if (!this.postId) {
                return this.$router.push({
                    path: '/',
                    message: `No id found to edit post`
                })
            }

            const { post, error } = await this.getPostById(this.postId);
            if (error) {
                return this.$router.push({
                    path: `/`,
                    message: error
                })
            }

            if (post.author_id !== this.$store.state.profile?.id) {
                return this.$router.push({
                    path: `/`,
                    message: `Unauthorized to edit post`,
                });
            }

            this.post = post;

        },
        insertPostData() {
            this.postBody = this.post.body;
            if (this.post.media_url) {
                this.mediaUrl = this.post.media_url;
            }
        },
        toggleSelectMediaFile() {
            if (this.mediaFile || this.mediaUrl) {
                this.mediaFile = null;
                this.mediaInput = null;
                this.removeMedia = true;
                this.mediaUrl = null;
                return;
            }
            this.mediaInput = this.mediaInput || document.createElement('input');
            this.mediaInput.type = 'file';
            this.mediaInput.accept = 'video/*,image/*'
            this.mediaInput.click();
            this.mediaInput.addEventListener('change', (event: Event) => {
                this.mediaFile = this.mediaInput.files[0];
                this.removeMedia = false;
                this.updateMedia = true;
            })
        },
        async submit() {
            if (!this.validForm) {
                return this.$nuxt.$emit('toast', {
                    message: `Post not valid`,
                    textColor: `text-rose-500`
                });
            }

            // todo remove media if added
            // if (this.mediaFile && (!this.mediaFile?.type.includes('image') && !this.mediaFile?.type.includes('video'))) {
            //     return this.$nuxt.$emit('toast', {
            //         message: `File  type is not valid`,
            //         textColor: `text-rose-500`
            //     });
            // }

            // todo - check file size limit

            this.loading = true;

            const response = await this.updatePost({
                authorId: this.userProfile.id,
                bulletinId: this.bulletin.id,
                postBody: this.postBody,
                postId: this.post.id,
                removeMedia: this.removeMedia,
                updateMedia: this.updateMedia,
                media_url: this.post.media_url,
                media_type: this.post.media_type,
                mediaFile: this.mediaFile ?? undefined,
            });

            if (response?.error) {
                this.loading = false;
                return this.$nuxt.$emit('toast', {
                    message: response.error,
                    textColor: `text-rose-500`
                });
            }

            this.$router.push({
                path: '/',
                query: { message: 'New Post added to bulletin!' }
            });
        }
    },
    async created() {
        await this.init();
    },
    beforeDestroy() {
    },
    components: { Toast, Loading, CloseIcon },
    mixins: [bulletinMixinVue, userMixinVue, postMixinVue]
})
</script>

<style lang="scss" >
textarea {
    min-height: 50vh !important;
    padding: .5rem !important;
}
</style>
  