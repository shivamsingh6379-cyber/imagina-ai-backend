const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_URL = "https://api-inference.huggingface.co/models/prompthero/openjourney-v4";

app.get('/', (req, res) => {
  res.send('ImaginAI Backend is alive on Render!');
});

app.post('/generate-image', async (req, res) => {
  console.log("Request received...");
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
        if(response.status === 503) {
            return res.status(503).json({ error: 'AI model is waking up, please try again in about 20-30 seconds.' });
        }
      throw new Error(`AI API Error: ${await response.text()}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    console.log("Image generated!");
    res.status(200).json({ image: imageDataUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sorry, the server encountered an error.' });
  }
});

app.listen(port, () => {
  console.log(`Server is ready at port ${port}`);
});
