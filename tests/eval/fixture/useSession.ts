import { ref } from 'vue'

const token = ref<string | null>(localStorage.getItem('auth_token'))

export function useSession() {
  function signIn(res: any) {
    localStorage.setItem('auth_token', res.access_token)
    token.value = res.access_token
  }

  function signOut() {
    localStorage.removeItem('auth_token')
    token.value = null
  }

  function isExpired() {
    if (!token.value) return true
    const payload = JSON.parse(atob(token.value.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  }

  return { token, signIn, signOut, isExpired }
}
