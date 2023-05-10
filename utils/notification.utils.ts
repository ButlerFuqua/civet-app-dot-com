import { SupabaseClient } from "@supabase/supabase-js";

export type CreateNotificationRequest = {
    profile_id: string
    label: string
    description: string
    icon?: string
    link?: string
}


export const NotificationLabels = {
    postLiked: 'Post liked',
}

export const createNotification = async (supabase: SupabaseClient, requests: CreateNotificationRequest[]): Promise<void | { error: string }> => {
    const { error } = await supabase
        .from('notification')
        .insert(requests.map(request => ({ ...request, seen: false })));

    if (error) {
        console.error(error)
        return { error: error.message }
    }
}

export const markNotificationAsSeen = async (supabase: SupabaseClient, id: string): Promise<void | { error: string }> => {
    const { error } = await supabase
        .from('notification')
        .update({
            seen: true,
        })
        .eq('id', id)

    if (error) {
        console.log(error)
        return { error: error.message }
    }
}

export const deleteNotificationAsSeen = async (supabase: SupabaseClient, id: string): Promise<void | { error: string }> => {
    const { error } = await supabase
        .from('notification')
        .update({
            seen: true,
        })
        .eq('id', id)

    if (error) {
        console.log(error)
        return { error: error.message }
    }
}
