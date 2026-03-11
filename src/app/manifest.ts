export default function manifest() {
    return {
        name: 'AceTrack - Site Reports',
        short_name: 'AceTrack',
        description: 'Progressive Web App for Ace Facades Site Supervisors to digitize weekly reporting.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#3b82f6',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
