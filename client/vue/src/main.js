import './assets/main.css'

import { createHead } from 'unhead'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import externalScripts, { loadExternalScripts } from './plugins/externalScripts'

const app = createApp(App)
const head = createHead()

loadExternalScripts().then(() => {
  app.use(head)
  app.use(router)
  app.use(externalScripts)

  app.mount('#app')
})
