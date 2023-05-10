
export type Bulletin = {
    id: string
    slug: string
    title: string
    ownerId: string
    about: string
}

export type Profile = {
    id: string
    username: string
}

export type StateType = {
    bulletin: Bulletin | null
    profile: Profile | null
}

export const state = (): StateType => ({
    bulletin: null,
    profile: null
})

export const getters = {
    getBulletin(state: StateType) {
        return state.bulletin
    },
    getProfile(state: StateType) {
        return state.profile
    }
}

export const mutations = {
    setBulletin(state: StateType, bulletin: Bulletin) {
        state.bulletin = bulletin;
    },
    setProfile(state: StateType, profile: Profile) {
        state.profile = profile;
    },
    removeBulletin(state: StateType) {
        state.bulletin = null;
    },
    removeProfile(state: StateType) {
        state.profile = null;
    }
}

//   export const actions = {
//     async fetchCounter({ state }: {state: StateType}) {
//       // make request
//       const res = { data: 10 };
//       state.bulletinSlug = res.data;
//       return res.data;
//     }
//   }