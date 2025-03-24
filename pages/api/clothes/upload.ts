import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeClothingImage } from '@/lib/gemini';

const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
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
    const { name, category, tags, userData } = req.body;
    
    // Parse user data and tags
    const user = JSON.parse(userData);
    const parsedTags = JSON.parse(tags || '[]');

    // First ensure user exists in database
    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl
      },
    });

    // Use Gemini API to analyze the image and generate tags
    const imageFilePath = path.join(uploadDir, file.filename);
    const imageBuffer = fs.readFileSync(imageFilePath);
    
    // Generate AI tags from the image
    console.log(`Analyzing image for clothing item: ${name} (${category})`);
    console.log(`User-provided tags: ${parsedTags.join(', ') || 'none'}`);
    
    const enhancedTags = await analyzeClothingImage(
      imageBuffer,
      category,
      name,
      parsedTags
    );
    
    console.log(`AI-enhanced tags (${enhancedTags.length}): ${enhancedTags.join(', ')}`);

    // Define a proper typed data object for creating clothes
    const clothesData: any = {
      name,
      category,
      tagsText: JSON.stringify(enhancedTags), // Store as JSON string
      imageUrl: `/uploads/${file.filename}`,
      user: {
        connect: {
          id: dbUser.id
        }
      }
    };

    // Then create the clothes entry
    const clothes = await prisma.clothes.create({
      data: clothesData
    });

    res.status(200).json({ 
      success: true, 
      data: clothes 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error uploading file',
    });
  }
} 