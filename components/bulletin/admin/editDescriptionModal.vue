<template>
    <v-dialog v-model="showModal" fullscreen :scrim="false" transition="dialog-bottom-transition">
        <v-card tile>
            <v-toolbar dark color="primary">
                <v-btn icon dark @click="toggleModal()">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Edit description</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn color="white" text @click="cancel">
                        Cancel
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <div class="container mx-auto">
                <form v-if="!submitting" @submit.prevent="submit" class="mt-5">
                    <v-textarea outlined dense v-model="description" aria-placeholder="description" placeholder="description" required :rules="descriptionRules"></v-textarea>
                    <div class="flex justify-center">
                        <button :disabled="!validForm" :class="validForm ? 'bg-white text-black shadow-md' : 'text-gray-400'" class="rounded-full py-1 px-5 transition-all text-lg">
                            Save
                        </button>
                    </div>
                </form>
                <div v-else>
                    Submitting...
                </div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';

import Joi from 'joi';

import { createClient } from '@supabase/supabase-js';
import { Console } from 'console';

const schema = Joi.object({
    description: Joi.string().min(6),
});

export default Vue.extend({
    name: "EditDescriptionModal",
    props: ['showModal', 'toggleModal'],
    computed: {
        validForm(): boolean {
            return schema.validate({
                description: (this as any).about,
            }).error ? false : true;
        }
    },
    data(): any {
        return {
            description: null,
            descriptionRules: [
                (v: string) => !!v || 'About is required',
                (description: string) => !schema.validate({ description }).error || schema.validate({ description }).error?.details[0].message,
            ],
            apiUrl: '',
            publicKey: '',
            bulletin: null,
            submitting: false
        }
    },
    methods: {
        init() {
            if (!process?.client) {
                return;
            }
            const { apiUrl, publicKey } = process.env;
            if (!apiUrl || !publicKey) {
                throw new Error(`Missing credentials`);
            }
            this.apiUrl = apiUrl;
            this.publicKey = publicKey;
            this.bulletin = this.$store.state.bulletin;
            this.description = this.bulletin?.description;
            this.submitting = false;

        },
        cancel() {
            this.toggleModal();
            this.init();
        },
        async submit() {
            if (!this.validForm) {
                return;
            }

            this.submitting = true;

            if (!this.bulletin) {
                return this.$router.push({
                    name: '/',
                    query: { message: `Bulletin not found` }
                })
            }

            const supabase = createClient(this.apiUrl, this.publicKey);

            const { error } = await supabase
                .from('bulletin')
                .update({ description: this.description })
                .eq('id', this.bulletin.id);

            if (error) {
                this.submitting = false;
                return this.$nuxt.$emit('toast', {
                    message: `Error updating bulletin`,
                    textColor: `text-rose-600`
                });
            }

            this.$store.commit('setBulletin', {
                ...this.bulletin,
                description: this.description
            });

            this.$nuxt.$emit("bulletin_update");
            this.toggleModal();
            setTimeout(this.init, 600);
        }
    },
    created() {
        this.init();
    }

});
</script>

<style lang="scss" scoped>
.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
    transition: transform .2s ease-in-out;
}
</style>