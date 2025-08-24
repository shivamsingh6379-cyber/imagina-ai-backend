const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ### CHANGE 1: Using a more reliable, official AI model ###
const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
const HF_TOKEN = process.env.HF_TOKEN;

app.get('/', (req, res) => {
  res.send('ImaginAI Backend is alive! Version 2.0');
});

// ### CHANGE 2: A special test function for us ###
app.get('/check-token', (req, res) => {
    if (HF_TOKEN && HF_TOKEN.startsWith('hf_')) {
        res.status(200).json({ status: "SUCCESS", message: "HF_TOKEN is configured correctly on the server." });
    } else {
        res.status(500).json({ status: "ERROR", message: "HF_TOKEN is missing or invalid on the server." });
    }
});


app.post('/generate-image', async (req, res) => {
  console.log("Request received...");
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  if (!HF_TOKEN) {
      return res.status(500).json({ error: 'Server configuration error: Hugging Face token is missing.' });
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_TOKEN}`
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        if(response.status === 503) {
            return res.status(503).json({ error: 'AI model is waking up, please try again in about 30 seconds.' });
        }
      // Return the actual error from Hugging Face for better debugging
      return res.status(response.status).json({ error: `AI API Error: ${errorText}` });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    console.log("Image generated successfully!");
    res.status(200).json({ image: imageDataUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sorry, the server encountered a critical error.' });
  }
});

app.listen(port, () => {
  console.log(`Server is ready at port ${port}`);
});
