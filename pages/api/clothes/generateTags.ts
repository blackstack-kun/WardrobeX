import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeClothingImage } from '@/lib/gemini';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = './temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Process the file upload
    const processUpload = async () => {
      return new Promise((resolve, reject) => {
        upload.single('image')(req as any, res as any, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    };

    await processUpload();

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { name, category, tags } = req.body;
    
    // Parse tags
    const parsedTags = JSON.parse(tags || '[]');

    // Use Gemini API to analyze the image and generate tags
    const imageFilePath = path.join(file.destination, file.filename);
    const imageBuffer = fs.readFileSync(imageFilePath);
    
    console.log(`Generating tags for image: ${name || 'Unnamed'} (${category})`);
    
    // Generate AI tags from the image
    const generatedTags = await analyzeClothingImage(
      imageBuffer,
      category,
      name || 'Unnamed Item',
      []  // Don't include user tags so we can see AI tags separately
    );
    
    console.log(`Generated ${generatedTags.length} tags: ${generatedTags.join(', ')}`);

    // Clean up the temporary file
    try {
      fs.unlinkSync(imageFilePath);
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }

    res.status(200).json({ 
      success: true, 
      tags: generatedTags
    });

  } catch (error: any) {
    console.error('Tag generation error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error generating tags',
    });
  }
} 