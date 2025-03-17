/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.{js,jsx,ts,tsx}', // Scan all JS/JSX/TS/TSX files in src/
    ],
    theme: {
        extend: {
            colors: {
                // Backgrounds
                'background-light': '#F9FAFB', // grey.50
                'background-default': '#F3F4F6', // grey.100
                'background-white': '#FFFFFF', // white
                'background-gradient': 'linear-gradient(to bottom right, #1E3A8A, #1E40AF, #1E3A8A)', // indigo-900 via blue-800 to blue-900
                'background-overlay': 'rgba(0, 0, 0, 0.2)', // LoadingIndicator overlay

                // Text and UI
                'text-primary': '#1F2937', // gray-800
                'text-secondary': '#4B5563', // gray-600
                'text-muted': '#6B7280', // gray-500
                'text-hover': '#374151', // gray-700
                'text-disabled': '#D1D5DB', // gray-300
                'text-light': '#F3F4F6', // blue-100 (light text)

                // Primary (Blue)
                'primary': '#2563EB', // blue-600
                'primary-dark': '#1D4ED8', // blue-700
                'primary-light': '#60A5FA', // blue-400
                'primary-accent': '#1E40AF', // blue-800
                'primary-deep': '#1E3A8A', // blue-900

                // Indigo (Hero Gradient)
                'indigo-deep': '#312E81', // indigo-900
                'indigo-light': '#A5B4FC', // indigo-300

                // Status Colors (from StatusIndicator)
                'success': '#2ECC71', // success.main (green)
                'warning': '#F1C40F', // warning.main (yellow)
                'info': '#3498DB', // info.main (blue)
                'error': '#E74C3C', // error.main (red)
                'neutral': '#9CA3AF', // grey-500
                'neutral-light': '#E5E7EB', // grey-300
                'neutral-muted': '#9CA3AF', // grey-600
                'neutral-bg': '#E5E7EB', // grey-200

                // Additional Colors from Hero
                'highlight': '#3B82F6', // blue-500
            },
        },
    },
    plugins: [],
};