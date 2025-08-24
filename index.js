const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Hum body se bade data (image) le sakein, isliye limit badha di hai
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Yeh naya AI model image ko modify karne ke liye best hai
const IMAGE_TO_IMAGE_API_URL = "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix";
const TEXT_TO_IMAGE_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
const HF_TOKEN = process.env.HF_TOKEN;

app.get('/', (req, res) => {
  res.send('ImaginAI Backend v2 is alive and ready!');
});

app.post('/generate-image', async (req, res) => {
  const { prompt, image } = req.body; // Ab hum image bhi le rahe hain

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }
  
  const API_URL = image ? IMAGE_TO_IMAGE_API_URL : TEXT_TO_IMAGE_API_URL;
  console.log(`Request received. Using model: ${API_URL}`);

  // Agar image hai, to use prompt ke saath bhejein. Agar nahi, to sirf prompt.
  const payload = image ? { inputs: prompt, image: image.split(',')[1] } : { inputs: prompt };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_TOKEN}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        if (response.status === 503) {
            return res.status(503).json({ error: 'AI model is waking up, please try again in about 30 seconds.' });
        }
      throw new Error(`AI API Error: ${await response.text()}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    console.log("Image generated successfully!");
    res.status(200).json({ image: imageDataUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sorry, the server encountered an error.' });
  }
});

app.listen(port, () => {
  console.log(`Server is ready at port ${port}`);
});
