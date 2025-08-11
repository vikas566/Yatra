# 🚀 Yatrasangam Cultural Planner

A modern web application for cultural event planning and management, built with Vue.js and powered by cutting-edge technologies.

## ✨ Features

- 🌐 Multi-language support
- 🎨 Beautiful, responsive UI
- 🔄 Real-time updates
- 🤖 AI-powered assistance (OpenRouter Integration)
- 📱 Mobile-friendly design

## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** - Progressive JavaScript Framework
- **Vite** - Next Generation Frontend Tooling
- **Vue Router** - Official Router for Vue.js
- **Pinia** - Vue Store Management
- **Tailwind CSS** - Utility-first CSS Framework

### AI Integration
- **OpenRouter API** - Advanced AI capabilities
- **Language Models** - deepseek/deepseek-r1-distill-llama-70b

### Development Tools
- **TypeScript** - Static Type Checking
- **ESLint** - Code Quality Tool
- **Prettier** - Code Formatter
- **Vite HMR** - Hot Module Replacement

## 📦 Dependencies

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.0.0",
    "pinia": "^2.0.0",
    "tailwindcss": "^3.0.0",
    "@headlessui/vue": "latest",
    "@heroicons/vue": "latest",
    "axios": "^1.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.4.0",
    "@types/node": "^20.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```
Dependencies (Libraries our application needs to run):

1.vue: The core Vue.js 3 library for building user interfaces.
2.vue-router: For handling navigation and routing within the Vue application.
3.pinia: A state management library for Vue, providing a more intuitive and type-safe way to manage application state.
4.tailwindcss: A utility-first CSS framework for rapid UI development.
5.@headlessui/vue: A set of unstyled, accessible UI components for Vue, designed to work seamlessly with Tailwind CSS.
6.@heroicons/vue: A collection of beautiful SVG icons as Vue components.
7.axios: A promise-based HTTP client for making API requests.
Development Dependencies (Tools used during development, not needed in production):

8.@vitejs/plugin-vue: A Vite plugin that provides Vue 3 Single-File Component (SFC) support.
9.typescript: A superset of JavaScript that adds static typing, improving code maintainability.
9.vite: A fast build tool that provides a rapid development experience.
10.@types/node: Type definitions for Node.js, used for TypeScript development.
11.autoprefixer: A PostCSS plugin that adds vendor prefixes to CSS rules, ensuring cross-browser compatibility.
12.postcss: A tool for transforming CSS with JavaScript plugins, used here as a part of the tailwind configuration.


## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/yatrasangam.git
cd yatrasangam
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your configuration

4. Start development server
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables
```env
VITE_OPENROUTER_API_KEY=your_api_key
VITE_APP_TITLE=Yatrasangam
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run type-check` - Check TypeScript types

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@yatrasangam.com or join our Slack channel.

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- All contributors who have helped this project grow

---

Made with ❤️ by the Yatrasangam Team 