// https://nuxt.com/docs/api/configuration/nuxt-config
import { camelCase, remove, upperFirst, without } from 'lodash-es'

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  hooks: {
    'pages:extend': function (pages) {
      remove(pages, page => page.path.split('/').includes('components'))
    },
    'components:extend': function (components) {
      components.forEach((component) => {
        const namePaths = without(component.kebabName.split('-'), 'components')
        const kebabName = namePaths.join('-')
        component.kebabName = kebabName
        component.pascalName = upperFirst(camelCase(kebabName))
      })
    },
  },
  components: [
    '~/components',
    {
      path: '~/pages',
      pattern: '*/components/**',
    },
  ],
})
