/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#667eea',
                secondary: '#56e8fc',
                text: '#ffffff',
                border: '#333333',
                surface: 'rgba(255, 255, 255, 0.05)',
                'surface-weak': 'rgba(255, 255, 255, 0.03)',
                'surface-strong': 'rgba(255, 255, 255, 0.1)',
                muted: '#a0aec0',
                success: '#48bb78',
                error: '#f56565',
            },
            backgroundImage: {
                'primary-gradient': 'linear-gradient(135deg, #667eea, #56e8fc)',
                'app-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            },
        },
    },
    plugins: [],
}
