<script lang="ts">
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Vue from 'vue';
import { createNotification, CreateNotificationRequest, NotificationLabels } from '~/utils/notification.utils';

export type PostThumbDTO = {
    id: string
    author_id: string
    body: string
    bulletin_id: string
    created_at: string
    modified_at: string
    username: string
    avatar_url: string | null
    comment_count: number
    likes: string | string[]
    media_url: string
    media_type: string,
    comment_authors: string;
}

type Data = {
    apiUrl: string
    publicKey: string
    supabase: null | SupabaseClient,
}

export type CreatePostRequest = {
    bulletinId: string,
    authorId: string,
    postBody: string,
    mediaFile?: File
}

export type UpdatePostRequest = CreatePostRequest & {
    postId: string
    removeMedia: boolean
    updateMedia: boolean
    media_type?: string
    media_url?: string
}

export type Post = {
    id: string
    author_id: string
    body: string
    created_at: string
    modified_at: string
}

type MediaDataResponse = {
    bucketName?: 'post-images' | 'post-videos'
    media_type?: string
    media_url?: string
    error?: string
}

export const ReactionLabels = {
    like: 'Like',
    pluralLike: 'Likes'
}

export const ReactionEntityTypes = {
    post: 'post',
}

// utils

const getMediaFileData = async (supabase: SupabaseClient, mediaFile: File | undefined, bulletinId: string, authorId: string): Promise<MediaDataResponse> => {

    if (!mediaFile) {
        return {}
    }

    // * If media file
    let bucketName: 'post-images' | 'post-videos' | undefined;
    let media_type: string | undefined;
    let media_url: string | undefined;

    // get file ext type and video or image
    if (mediaFile.type.toLowerCase().includes('image')) {
        bucketName = 'post-images';
    } else if (mediaFile.type.toLowerCase().includes('video')) {
        bucketName = 'post-videos';
    }
    media_type = mediaFile.type;

    if (!bucketName || !media_type) {
        return { error: 'Unsupported media type, must be image or video.' }
    }

    // store file: post-images, post-videos
    const mediaPath = `${bulletinId}/${authorId}/${(new Date()).toISOString()}-${mediaFile.name}`;
    const { data: storeMediaData, error: storeMediaFileError } = await supabase
        .storage
        .from(bucketName)
        .upload(mediaPath, mediaFile, {
            cacheControl: '3600',
            upsert: false
        });

    if (storeMediaFileError) {
        return { error: storeMediaFileError.message }
    }
    // get public url to save in post as media_url
    media_url = `https://wfrsduqjqrnvitufutjb.supabase.co/storage/v1/object/public/${bucketName}/${mediaPath}`;

    return {
        bucketName,
        media_type,
        media_url,
    }

}

export default Vue.extend({
    name: 'PostMixin',
    data(): Data {
        return {
            apiUrl: '',
            publicKey: '',
            supabase: null,
        }
    },
    methods: {
        async createPost(data: CreatePostRequest): Promise<void | { error?: string }> {
            const supabase = this.getClient();
            const { authorId, bulletinId, postBody, mediaFile } = data;

            // * get media data if there is a media file
            const { media_type, media_url, error: getMediaDataError } = await getMediaFileData(supabase, mediaFile, bulletinId, authorId);
            if (getMediaDataError) {
                return { error: getMediaDataError }
            }

            const { error } = await supabase
                .from('post')
                .insert([
                    {
                        author_id: authorId,
                        bulletin_id: bulletinId,
                        body: postBody,
                        media_url,
                        media_type
                    },
                ]);

            if (error) {
                return { error: error.message }
            }

        },
        async updatePost(data: UpdatePostRequest): Promise<void | { error?: string }> {
            const supabase = this.getClient();
            const { postId, authorId, bulletinId, postBody, media_type: mediaType, media_url: mediaUrl, mediaFile, removeMedia, updateMedia } = data;

            // remove media if requested
            let media_type: string | undefined | null = mediaType;
            let media_url: string | undefined | null = mediaUrl;
            if (removeMedia) {
                media_type = null;
                media_url = null;
            }

            // * get media data if there is a media file
            if (!removeMedia && updateMedia) {
                const { media_type: mediaType, media_url: mediaUrl, error: getMediaDataError } = await getMediaFileData(supabase, mediaFile, bulletinId, authorId);
                if (getMediaDataError) {
                    return { error: getMediaDataError }
                }
                media_type = mediaType;
                media_url = mediaUrl;
            }

            // todo, uncomment
            const { error } = await supabase
                .from('post')
                .update([
                    {
                        author_id: authorId,
                        bulletin_id: bulletinId,
                        body: postBody,
                        media_url,
                        media_type
                    },
                ])
                .eq('id', postId)

            if (error) {
                return { error: error.message }
            }

        },
        async getPostsByBulletinId(data: {
            bulletinId: string,
            limit: number,
            skip?: string
        }): Promise<{ error?: string, posts?: PostThumbDTO[] }> {
            const supabase = this.getClient();
            const { bulletinId, limit, skip } = data;
            const { data: posts, error } = await supabase.rpc('get_posts_for_bulletin', {
                bulletinid: bulletinId,
                quantity: limit,
                skip: skip || 0
            });

            if (error) {
                return { error: error.message };
            }

            return { posts: posts || [] }
        },
        async toggleLikesPost(data: {
            profileId: string,
            bulletinId: string,
            entityId: string,
            username: string,
            postAuthorId: string
        }): Promise<{ error?: string, count?: number }> {
            const supabase = this.getClient();
            const { profileId, entityId, } = data;
            const { data: likes, error } = await supabase
                .from('reaction')
                .select('*')
                .eq('author_id', profileId)
                .eq('entity_id', entityId)
                .eq('label', ReactionLabels.like)

            if (error || !likes) {
                return { error: error?.message || `Error reacting to post.` };
            }

            if (!likes.length) {
                const response: any = await this.addLikeToPost(data);
                if (response?.error) {
                    return { error: response.error };
                }
                return { count: 1 }
            }

            const response: any = await this.removeLikeFromPost(data);
            if (response?.error) {
                return { error: response.error };
            }
            return { count: -1 }

        },
        async addLikeToPost(data: {
            profileId: string,
            bulletinId: string,
            entityId: string,
            username: string,
            postAuthorId: string
        }): Promise<void | { error: string }> {
            const supabase = this.getClient();
            const { profileId, bulletinId, entityId, username, postAuthorId } = data;
            const { error } = await supabase
                .from('reaction')
                .insert({
                    author_id: profileId,
                    bulletin_id: bulletinId,
                    entity_id: entityId,
                    label: ReactionLabels.like,
                    label_plural: ReactionLabels.pluralLike,
                    entity_type: ReactionEntityTypes.post
                });

            if (error) {
                return { error: error.message };
            }

            // send notification
            const { platformHost } = process.env;
            let link = `https://${this.$store.state.bulletin.slug}.${platformHost}/posts/${entityId}`;
            if (platformHost?.includes('localhost:')) {
                link = link.replace('https', 'http');
            }
            if (profileId !== postAuthorId) {
                const notification: CreateNotificationRequest = {
                    profile_id: postAuthorId,
                    label: NotificationLabels.postLiked,
                    description: `${username} liked one of your posts.`,
                    link,
                };
                await createNotification(supabase, [notification]);
            }
        },
        async removeLikeFromPost(data: {
            profileId: string,
            bulletinId: string,
            entityId: string,
        }): Promise<void | { error: string }> {
            const supabase = this.getClient();
            const { profileId, bulletinId, entityId } = data;
            const { error } = await supabase
                .from('reaction')
                .delete()
                .eq('author_id', profileId)
                .eq('bulletin_id', bulletinId)
                .eq('entity_id', entityId)
                .eq('label', 'Like')
                .eq('entity_type', 'post');

            if (error) {
                return { error: error.message };
            }

            // delete notification
            const { platformHost } = process.env;
            let link = `https://${this.$store.state.bulletin.slug}.${platformHost}/posts/${entityId}`;
            if (platformHost?.includes('localhost:')) {
                link = link.replace('https', 'http');
            }
            const { error: deleteNotificationError } = await supabase
                .from('notification')
                .delete()
                .eq('label', NotificationLabels.postLiked)
                .eq('link', link)

            if (deleteNotificationError) {
                console.error(deleteNotificationError)
            }
        },
        async getPostById(id: string): Promise<{ error?: string, post?: any }> {
            const supabase = this.getClient();
            const { data: posts, error } = await supabase.from('post')
                .select('*')
                .eq('id', id);

            if (!posts || !posts.length || error) {
                return { error: error?.message || `No post found with id ${id}` }
            }

            return { post: posts[0] }
        },
        async getPostWithAuthorAndCommentData(postId: string): Promise<{ error?: string, post?: any }> {
            const supabase = this.getClient();
            const { data: posts, error } = await supabase.rpc('get_post_with_author_comment', {
                postid: postId,
            });

            if (!posts || !posts.length || error) {
                return { error: error?.message || `No post found with id ${postId}` }
            }

            return { post: posts[0] }
        },
        async getPostReactionsById(postId: string): Promise<{ error?: string, likes: any[] }> {
            const supabase = this.getClient();
            const { data: likes, error } = await supabase
                .from('reaction')
                .select('*')
                .eq('entity_id', postId)
                .eq('label', 'Like');

            if (error) {
                return { error: error?.message, likes: [] }
            }

            return { likes: likes || [] }
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