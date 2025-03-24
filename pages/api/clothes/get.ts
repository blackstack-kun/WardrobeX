import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ClothingItemWithTags {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const clothes = await prisma.clothes.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse the JSON tags for each clothing item
    const clothesWithParsedTags = clothes.map(item => {
      // The item from DB will have tagsText since we changed the schema
      const dbItem = item as any;
      return {
        id: dbItem.id,
        name: dbItem.name,
        category: dbItem.category,
        imageUrl: dbItem.imageUrl,
        tags: dbItem.tagsText ? JSON.parse(dbItem.tagsText) : [],
        userId: dbItem.userId,
        createdAt: dbItem.createdAt,
        updatedAt: dbItem.updatedAt
      } as ClothingItemWithTags;
    });

    res.status(200).json(clothesWithParsedTags);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error fetching clothes' });
  }
} 