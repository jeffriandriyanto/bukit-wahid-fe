module.exports = {
  apps: [
    {
      name: 'bukit-wahid-fe',
      port: '3000',
      exec_mode: 'fork',
      script: './.output/server/index.mjs',
      node_args: '--max-old-space-size=512',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NUXT_PUBLIC_BASE_URL: 'https://api.rw11bukitwahid.com/api/',
        NUXT_PUBLIC_SITE_URL: 'https://rw11bukitwahid.com'
      }
    }
  ]
}
