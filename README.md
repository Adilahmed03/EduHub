# EduHub - Educational Resource Hub

EduHub is a comprehensive educational platform that provides access to high-quality educational videos and PDF resources. The platform features an intelligent chatbot assistant and a user-friendly interface for searching and accessing educational content.

## Features

- **Video Search**: Search for educational videos with 100k+ views
- **PDF Search**: Find relevant educational PDFs
- **Smart Chatbot**: AI-powered assistant to help with educational queries
- **User Authentication**: Secure login and registration system
- **Modern UI**: Clean, responsive design with dark theme
- **Interactive Elements**: Floating icons and smooth animations

## Tech Stack

- **Frontend**: 
  - EJS (Embedded JavaScript)
  - Tailwind CSS
  - Font Awesome Icons
- **Backend**:
  - Node.js
  - Express.js
- **APIs**:
  - YouTube Data API
  - Google Custom Search API
  - Flowise Chatbot

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Adilahmed03/EduHub.git
cd EduHub
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
YOUTUBE_API_KEY=your_youtube_api_key
```

4. Start the server:
```bash
node index.js
```

## Project Structure

```
EduHub/
├── public/
│   ├── images/
│   └── styles.css
├── views/
│   ├── login.ejs
│   ├── register.ejs
│   ├── okay.ejs
│   └── you.ejs
├── index.js
├── package.json
└── .env
```

## Features in Detail

### Video Search
- Filters videos with 100k+ views
- Displays video duration and view count
- Shows suggested videos by students
- Sorts by popularity

### PDF Search
- Educational PDF search functionality
- Clean and intuitive interface
- Direct download links

### Chatbot Integration
- AI-powered educational assistant
- Available on all pages
- Helps with queries and recommendations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Adil Ahmed - [GitHub](https://github.com/Adilahmed03)

Project Link: [https://github.com/Adilahmed03/EduHub](https://github.com/Adilahmed03/EduHub)
