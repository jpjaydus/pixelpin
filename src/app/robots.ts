import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://pixelpin.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/projects/',
        '/api/',
        '/_next/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}