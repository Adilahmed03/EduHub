import express from "express";
import {google} from "googleapis";
import bodyParser from "body-parser";
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 4000;

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// Initialize the Custom Search API client with environment variables
const customsearch = google.customsearch({ 
  version: 'v1', 
  auth: process.env.GOOGLE_SEARCH_API_KEY 
});

// Load users from file or initialize empty object
let users = {};
try {
  const usersData = fs.readFileSync('users.json', 'utf8');
  users = JSON.parse(usersData);
} catch (error) {
  users = {};
}

// Initialize searchHistory as an array
let searchHistory = [];

// Save users to file
function saveUsers() {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Save history to file
function saveHistory() {
  fs.writeFileSync('history.json', JSON.stringify(searchHistory, null, 2));
}

// Function to add search to history
function addToHistory(query, type, resultCount) {
    const historyItem = {
        query,
        type,
        resultCount,
        timestamp: new Date().toISOString()
    };
    
    // Ensure searchHistory is an array before using unshift
    if (!Array.isArray(searchHistory)) {
        searchHistory = [];
    }
    
    searchHistory.unshift(historyItem);
    
    // Keep only last 50 items
    if (searchHistory.length > 50) {
        searchHistory = searchHistory.slice(0, 50);
    }
}

async function performSearch(query) {
  try {
    const response = await customsearch.cse.list({
      cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
      q: query,
      num: 10,
    });

    // Handle the search results
    const results = response.data.items;

    return results;
  } catch (error) {
    console.error('Error:', error);
  }
}

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/',(req,res) => {
  res.render('login.ejs');
});

app.post('/',(req,res) => {
  const { email, password } = req.body;
  
  if (users[email] && users[email] === password) {
    res.render('okay.ejs');
  } else {
    res.render('login.ejs', { error: 'Incorrect email or password' });
  }
});

app.get('/okay',(req,res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('okay.ejs');
});

app.get('/register',(req,res) => {
  res.render('register.ejs');
});

app.post('/register',(req,res) => {
  const { email, password } = req.body;
  
  if (users[email]) {
    res.render('register.ejs', { error: 'Email already registered' });
  } else {
    users[email] = password;
    saveUsers();
    res.render('login.ejs', { success: 'Registration successful! Please login.' });
  }
});

app.get('/you',(req,res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('you.ejs');
});

app.get('/history', (req, res) => {
    // Ensure searchHistory is an array
    if (!Array.isArray(searchHistory)) {
        searchHistory = [];
    }
    
    res.render('history', { 
        history: searchHistory,
        title: 'Search History'
    });
});

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.render('okay', { 
            error: 'Please enter a search term',
            q: query
        });
    }

    try {
        const results = await performSearch(query + ' filetype:pdf');
        
        // Add to history
        if (results && results.length > 0) {
            addToHistory(query, 'pdf', results.length);
        }

        res.render('okay', { 
            results: results || [],
            q: query
        });
    } catch (error) {
        console.error('Search error:', error);
        res.render('okay', { 
            error: 'Error searching for PDFs. Please try again.',
            q: query
        });
    }
});

app.get('/searchyt', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.render('you', { 
            error: 'Please enter a search term',
            q: query
        });
    }

    try {
        // Make YouTube API call
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query + ' educational',
                type: 'video',
                maxResults: 50,
                key: process.env.YOUTUBE_API_KEY
            }
        });

        // Get video details for view counts
        const videoIds = response.data.items.map(item => item.id.videoId).join(',');
        const videoDetails = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'contentDetails,statistics',
                id: videoIds,
                key: process.env.YOUTUBE_API_KEY
            }
        });

        // Process results
        const results = response.data.items.map((item, index) => {
            const videoDetail = videoDetails.data.items.find(v => v.id === item.id.videoId);
            return {
                title: item.snippet.title,
                link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                viewCount: videoDetail ? parseInt(videoDetail.statistics.viewCount) : 0,
                duration: videoDetail ? formatDuration(videoDetail.contentDetails.duration) : null,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                isSuggested: Math.random() > 0.7
            };
        }).filter(video => video.viewCount >= 100000);

        // Sort results by view count in descending order
        results.sort((a, b) => b.viewCount - a.viewCount);

        // Add to history
        if (results.length > 0) {
            addToHistory(query, 'video', results.length);
        }

        res.render('you', { 
            results: results || [],
            q: query
        });
    } catch (error) {
        console.error('YouTube search error:', error);
        res.render('you', { 
            error: 'Error searching for videos. Please try again.',
            q: query
        });
    }
});

// Helper function to format duration
function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');

  let formatted = '';
  if (hours) formatted += `${hours}:`;
  formatted += `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  return formatted;
}

app.listen(port , () => {
  console.log(`server running on ${port}`)
})
