<script lang="ts">
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Vue from 'vue';

export type CommentDTO = {
    id: string
    author_id: string
    body: string
    post_id: string
    post_author_id: string
    username: string
    avatar_url: null | string
    likes: string | string[]
    created_at: string
    modified_at: string
}


export type CreateCommentRequest = {
    authorId: string
    bulletinId: string
    parentId: string
    parentType: string
    body: string
    allowComments: boolean
}


// utils


export default Vue.extend({
    name: 'PostMixin',
    data(): any {
        return {
            apiUrl: '',
            publicKey: '',
            supabase: null,
        }
    },
    methods: {
        async createComment(data: CreateCommentRequest): Promise<void | { error: string }> {
            const {
                authorId,
                bulletinId,
                parentId,
                parentType,
                body,
                allowComments,
            } = data;

            const supabase = this.getClient();

            const { error } = await supabase.from('comment').insert([{
                author_id: authorId,
                bulletin_id: bulletinId,
                parent_id: parentId,
                parent_type: parentType,
                body,
                allow_comments: allowComments,
            }]);

            if (error) {
                console.error(error);
                return { error: error.message }
            }

        },
        async getCommentsByPostId(postId: string) {
            const supabase = this.getClient();
            const { data: comments, error } = await supabase.rpc('get_comments_with_author_data_by_post', {
                postid: postId,
            });

            if (error || !comments) {
                return { error: error?.message || `Error fetching post comments` };
            }

            return { comments }
        },
        getClient(): SupabaseClient {
            if (this.supabase) {
                return this.supabase as SupabaseClient;
            }
            this.supabase = createClient(this.apiUrl, this.publicKey)
            return this.supabase;
        }
    },
    created() {
    }
})
</script>