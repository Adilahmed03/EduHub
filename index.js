import express from "express";
import {google} from "googleapis";
import bodyParser from "body-parser";


// Replace with your own API key and Search Engine ID
const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({extended:true}));
const API_KEY = "AIzaSyC0nm2ZSgue2mxUuQUEmXoG1lWsiu0i-ps"
const CX = "5065ecbbf5b0a4386"

var details = {
  "username@gmail.com" : "password",
  "shiva@gmail.com" : "teja"
}

// Initialize the Custom Search API client
const customsearch = google.customsearch({ version: 'v1', auth: API_KEY });

async function performSearch(query) {
  try {
    const response = await customsearch.cse.list({
      cx: CX,
      q: query,
      num: 4,
    });

    // Handle the search results
    const results = response.data.items;

    return results;
  } catch (error) {
    console.error('Error:', error);
  }
}

app.use(express.static('public'));

app.get('/',(req,res) => {
  res.render('login.ejs');
});

app.post('/',(req,res) => {
  const email = req.query.email;
  const password = req.query.password;
  
  if (email in details && password == details[email]) {
    res.render('okay.ejs');
  }else {
    console.log('incorrect email or password')
    res.redirect('login.ejs');
  }
});
app.get('/okay',(req,res) => {
  res.render('okay.ejs');
});
app.get('/register',(req,res) => {
  res.render('register.ejs');
});

app.get('/you',(req,res) => {
  res.render('you.ejs');
});
app.post('/register',(req,res)=> {
  const email = req.query.email;
  const password = req.query.password;
  
  if (email in details && password == details[email]) {
    res.render('okay.ejs');
}else{
  details[email] = password
  res.render('login.ejs')
}
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
  const query = req.query.q;
  performSearch('site:youtube.com intitle: "' + query + '"' ).then((results) => {

      res.render('you.ejs', { results:results });
    }
  ).catch((error) => {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  });
});





app.listen(port , () => {
  console.log(`server running on ${port}`)
})
