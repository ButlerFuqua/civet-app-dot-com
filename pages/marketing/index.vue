<template>

  <div>
    <!-- Error toast -->
    <div v-if="errorMessage" class=" absolute top-2 z-40 w-full p-3">
      <div class="bg-rose-600 text-white rounded p-3 flex justify-between shadow-lg">
        <p>{{ errorMessage }}</p>
        <button @click="errorMessage = null">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.75 12C4.75 7.99594 7.99594 4.75 12 4.75V4.75C16.0041 4.75 19.25 7.99594 19.25 12V12C19.25 16.0041 16.0041 19.25 12 19.25V19.25C7.99594 19.25 4.75 16.0041 4.75 12V12Z"></path>
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 9.75L14.25 14.25"></path>
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.25 9.75L9.75 14.25"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- create bulletin form -->
    <div v-if="createBulletinModal" id="createBulletinModal" class="fixed w-full h-full bg-white z-20">

      <div class="flex justify-end p-3">
        <button @click="createBulletinModal = false">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.75 12C4.75 7.99594 7.99594 4.75 12 4.75V4.75C16.0041 4.75 19.25 7.99594 19.25 12V12C19.25 16.0041 16.0041 19.25 12 19.25V19.25C7.99594 19.25 4.75 16.0041 4.75 12V12Z"></path>
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 9.75L14.25 14.25"></path>
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.25 9.75L9.75 14.25"></path>
          </svg>
        </button>
      </div>

      <form v-if="!submitting && !newBulletinLink" class="mx-auto p-3 text-center flex flex-col items-center" @submit.prevent="signupAndCreateBulletin">
        <h1 class="text-4xl font-black mb-5">Great <span class="text-purple-700">choice</span>.</h1>
        <p class="mb-4">Choose <span class="font-semibold text-purple-800">login credentials</span> for your new site.</p>

        <v-text-field class="w-full" outlined rounded dense v-model="email" aria-placeholder="email" placeholder="email" required :rules="emailRules"></v-text-field>

        <v-text-field class="w-full" type="password" outlined rounded dense v-model="password" aria-placeholder="password" placeholder="password" required :rules="passwordRules"></v-text-field>

        <p class="">What will you call your bulletin site?</p>
        <p class="my-2">
          <small>You can change this later</small>
        </p>

        <v-text-field class="w-full" outlined rounded dense v-model="bulletinTitle" aria-placeholder="Bulletin Title" placeholder="Bulletin Title" required :rules="titleRules"></v-text-field>

        <button :disabled="!validForm" :class="validForm ? 'border-black hover:bg-white bg-black hover:text-black text-white' : 'text-gray-500'" class="mt-5 mb-2 rounded-full border  transition-all py-2 px-8 drop-shadow-lg font-semibold">Create</button>
      </form>
      <div v-else-if="submitting" class="flex items-center justify-center h-full">
        <div class="loader"></div>
      </div>
      <div v-else-if="newBulletinLink" class="h-full p-3 flex flex-col items-center">
        <h1 class="text-4xl mb-5">Visit your new <span class="font-black text-purple-700">bulletin</span>!</h1>
        <p class="my-5 text-blue-600 hover:text-blue-500 transition-all hover:underline">
          <a class="flex" :href="newBulletinLink" target="_blank">{{ newBulletinLink }} <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25V14.75"></path>
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.25 9.25V4.75H14.75"></path>
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 5L11.75 12.25"></path>
            </svg>
          </a>
        </p>
        <p>You will also be emailed a link to your bulletin.</p>
      </div>

    </div>
    <div v-else>
      <section id="landingBanner" class="text-right flex justify-end mb-5">
        <div>
          <!-- CTA title -->
          <p class="text-5xl sm:text-7xl font-extrabold mb-5">
            <span class="text-purple-700">Create</span> an online <span class="italic font-light">community</span>
          </p>

          <!-- CTA button -->
          <button @click="createBulletinModal = true" class="mt-5 mb-2 rounded-full border border-black bg-white hover:bg-black text-black hover:text-white transition-all py-2 px-8 drop-shadow-lg font-black">Go for it!</button>
          <p class="mt-5"><span class="font-black">Free <span class="text-purple-700">forever</span></span>. There is no
            paid plan.</p>
        </div>
      </section>
      <div class="container mx-auto">
        <section id="aboutCivet" class="p-3">
          <!-- what is Civet? -->
          <div class="my-5 flex flex-col items-center">
            <h1 class="font-black text-center text-4xl">What is <span class="text-purple-700">civet</span>?</h1>
            <p class="my-5 text-center">
              <span class="font-black text-purple-700">civet</span> is a digital bulletin for your community where members may post, like, comment, and more.
            </p>
            <div id="toFeaturesList" class="mt-5 flex flex-wrap justify-center">
              <div v-for="feature in topFeatures" :key="feature.title" class="border border-purple-700 border-2 rounded p-3 m-3 text-center">
                <p class="font-extrabold text-lg">{{ feature.title }}</p>
                <p v-html="feature.html"></p>
              </div>
            </div>
            <button @click="createBulletinModal = true" class="mt-5 mb-2 rounded-full border border-black hover:bg-white bg-black hover:text-black text-white transition-all py-2 px-8 drop-shadow-lg font-black">Go for it!</button>
          </div>

          <br>
          <!-- How's it free? -->
          <div class="my-5 flex flex-col items-center">
            <h1 class="font-black text-center text-4xl">How's it <span class="text-purple-700">free</span>?</h1>
            <p class="my-5 text-center"><span class="font-black text-purple-700">Good question</span>. Users have the option to post
              anonymously
              and can pay (<span class="text-purple-700 italic">if they want</span>) to see who made the post or keep
              it anonymous forever.</p>
            <button @click="createBulletinModal = true" class="mt-5 mb-2 rounded-full border border-black hover:bg-white bg-black hover:text-black text-white transition-all py-2 px-8 drop-shadow-lg font-black">Go for it!</button>
          </div>

          <br>
          <!-- Anything else? -->
          <div class="my-5 flex flex-col items-center">
            <h1 class="font-black text-center text-4xl"><span class="text-purple-700">Anything</span> else?</h1>
            <p class="my-5 text-center">Feel free to checkout out a list of <span class="font-black text-amber-700 underline cursor-pointer hover:text-amber-600 transition-all">features</span>.
            </p>
            <button @click="createBulletinModal = true" class="mt-5 mb-2 rounded-full border border-black hover:bg-white bg-black hover:text-black text-white transition-all py-2 px-8 drop-shadow-lg font-black">Go for it!</button>
          </div>
        </section>
      </div>
      <footer class="text-white p-2 relative">
        <div class="container mx-auto">
          <NuxtLink v-for="link in footerLinks" :key="link.label" :to="link.path">
            <p class="my-3 underline cursor-pointer text-white hover:text-amber-300 transition-all">{{ link.label }}</p>
          </NuxtLink>
        </div>
        <div class="absolute z-10 bottom-3 w-full">
          <div class="container mx-auto p-5">
            <p>Copyrights and what not.</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';
import Joi from 'joi';

const schema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }),
  bulletinTitle: Joi.string().min(4).max(100),
  password: Joi.string().min(6),
});

export default Vue.extend({
  head: {
    link: [
      { rel: 'stylesheet', type: 'text/css', href: 'https://cdn.tailwindcss.com' },
    ]
  },
  name: 'IndexPage',
  data() {
    return {
      createBulletinModal: false,
      topFeatures: [
        {
          title: `Unlimited`,
          html: `As many communities, members, posts, and domains as you want.`
        },
        {
          title: `Free domain`,
          html: `<span class="text-purple-700">whatever.civetapp.com</span> outta the box with no setup at all.`
        },
        {
          title: `Custom domain`,
          html: `<span class="text-purple-700">whateverelse.com</span> if you feel like adding it.`
        },
      ],
      footerLinks: [
        {
          label: 'Terms and conditions',
          path: '#'
        },
        {
          label: 'Data collection policy',
          path: '#'
        },
        {
          label: 'Privacy policy',
          path: '#'
        },
      ],
      email: '',
      password: '',
      bulletinTitle: '',
      submitting: false,
      newBulletinLink: null,
      errorMessage: null,
      emailRules: [
        (v: string) => !!v || 'Email is required',
        (email: string) => !schema.validate({ email }).error || schema.validate({ email }).error?.details[0].message,
      ],
      passwordRules: [
        (v: string) => !!v || 'Password is required',
        (password: string) => !schema.validate({ password }).error || schema.validate({ password }).error?.details[0].message,
      ],
      titleRules: [
        (v: string) => !!v || 'Bulletin title is required',
        (bulletinTitle: string) => !schema.validate({ bulletinTitle }).error || schema.validate({ bulletinTitle }).error?.details[0].message,
      ],
    }
  },
  computed: {
    validForm() {
      return schema.validate({
        email: (this as any).email,
        bulletinTitle: (this as any).bulletinTitle,
        password: (this as any).password
      }).error ? false : true;
    }
  },
  methods: {
    async signupAndCreateBulletin() {
      this.submitting = true;
      try {
        const { data } = await axios.post(`/api/landing/go-for-it`, {
          email: this.email.trim(),
          password: this.password.trim(),
          bulletinTitle: this.bulletinTitle.trim(),
        });
        this.newBulletinLink = data.link;
      } catch (error: any) {
        console.error(error.response.data);
        this.errorMessage = error.response.data.message || error.message || `Error creating account and bulletin.`

      }
      this.submitting = false;
    },
  }
});
</script>

<style lang="scss" scoped>
form {
  width: 450px;
  max-width: 90%;
}

#landingBanner {
  overflow: auto;
  height: 95vh;
  background: url('~assets/images/mobile_landing.png');
  background-position: center;
  background-size: cover;

  transition: all .2s;

  @media screen and (min-width: 700px) {
    background: url('~assets/images/desktop_landing.png');
    background-position: center;
    background-size: cover;
    height: 100vh;
  }

  & div {
    margin-top: 2rem;
    padding: 1rem;

    @media screen and (min-width: 700px) {
      max-width: 70%;
      margin-top: 5rem;
      margin-right: 2rem;
    }

  }

}

#toFeaturesList {
  & div {
    box-shadow: 5px 5px 0 #412898;
    width: 210px;
  }
}

footer {
  background: url('~assets/images/desktop_landing_footer.png');
  background-position: center;
  background-size: cover;
  min-height: 100vh;
}

.loader {
  border: 16px solid #f3f3f3;
  border-radius: 50%;
  border-top: 16px solid #412898;
  width: 120px;
  height: 120px;
  -webkit-animation: spin 2s linear infinite;
  /* Safari */
  animation: spin 2s linear infinite;
}

/* Safari */
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
  }

  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
