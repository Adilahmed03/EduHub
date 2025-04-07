import express from "express";
import {google} from "googleapis";
import bodyParser from "body-parser";
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 4000;

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

// Save users to file
function saveUsers() {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
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
  res.render('you.ejs');
});

app.get('/search', async (req, res) => {
  const query = req.query.q;
  performSearch(query + ' filetype:pdf').then((results) => {
      res.render('okay.ejs', { results:results });
    }
  ).catch((error) => {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  });
});

app.get('/searchyt', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.render('you', { error: 'Please enter a search term' });
    }

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
        isSuggested: Math.random() > 0.7 // Randomly mark some videos as suggested by students
      };
    });

    // Sort results by view count in descending order
    results.sort((a, b) => b.viewCount - a.viewCount);

    res.render('you', { 
      results,
      q: query
    });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.render('you', { 
      error: 'Error searching for videos. Please try again.',
      q: req.query.q
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
