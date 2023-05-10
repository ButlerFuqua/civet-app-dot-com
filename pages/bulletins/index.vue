<template>
  <div id="bulletinContent" v-if="bulletin" class="md:container md:mx-auto">
    <div v-if="posts">
      <PostThumb v-for="post in posts" class="my-5 w-full" :key="post.id" :post="post" :ownerId="bulletin.owner_id" :bulletinId="bulletin.id" :currentUserId="currentUserProfile?.id" />
    </div>
    <div v-if="cursor" class="flex justify-center p-3">
      <button @click="getMorePosts" class="underline">Load more</button>
    </div>
    <div v-else class="p-3">
      <p class="text-center">Check back later for more posts!</p>
    </div>
  </div>
  <div style="height:80vh" v-else class="flex justify-center items-center">
    <Loading />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Loading from '~/components/loaders/loading.vue';
import PostThumb from '~/components/bulletin/posts/postThumb.vue';
import postMixinVue from '~/mixins/postMixin.vue';

export default Vue.extend({
  name: "SubdomainPage",
  layout: "bulletin",
  data(): any {
    return {
      bulletin: this.$store.state.bulletin,
      posts: null,
      pageLimit: 10,
      cursor: null
    };
  },
  computed: {
    currentUserProfile() {
      return this.$store.state.profile;
    }
  },
  methods: {
    async init() {
      if (!this.bulletin) {
        return;
      }
      const { apiUrl, publicKey } = process.env;
      if (!apiUrl || !publicKey) {
        throw new Error(`Missing credentials`);
      }
      this.apiUrl = apiUrl;
      this.publicKey = publicKey;
      const { error, posts } = await this.getPostsByBulletinId({
        bulletinId: this.bulletin.id,
        limit: this.pageLimit,
      });

      if (error) {
        return this.$nuxt.$emit('toast', {
          message: error,
          textColor: `text-rose-500`
        });
      }

      this.setPostsAndCursor(posts);
    },
    async getMorePosts() {
      if (!this.cursor) {
        return this.$nuxt.$emit('toast', {
          message: `Check back later for more posts.`
        });
      }

      const { error, posts } = await this.getPostsByBulletinId({
        bulletinId: this.bulletin.id,
        limit: this.pageLimit,
        skip: this.posts.length,
      });

      if (error) {
        return this.$nuxt.$emit('toast', {
          message: error,
          textColor: `text-rose-500`
        });
      }

      this.setPostsAndCursor(posts);

    },
    setPostsAndCursor(posts: any[]) {
      const postsToAdd = posts
        .splice(0, this.pageLimit);
      this.posts = [...(this.posts || []), ...postsToAdd];
      if (posts.length) {
        this.cursor = posts[posts.length - 1].id;
      } else {
        this.cursor = null;
      }
    },
    async checkRestToken() {
      if (!process?.client) {
        return;
      }
      const { reset_token } = this.$route.query;
      if (!reset_token) {
        return;
      }
      return this.$router.push({
        path: '/login',
        query: { reset_token }
      });
    }
  },
  async created() {
    this.$nuxt.$on('bulletin_update', async () => {
      this.bulletin = this.$store.state.bulletin;
      await this.init();
    });
    await this.init();
    await this.checkRestToken();
  },
  beforeDestroy() {
    this.$nuxt.$off('bulletin_update');
  },
  components: { Loading, PostThumb },
  mixins: [postMixinVue]
});
</script>

<style lang="scss" scoped>

</style>
