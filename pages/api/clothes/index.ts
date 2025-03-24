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
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Fetch all clothes for the user
      const clothes = await prisma.clothes.findMany({
        where: {
          userId: userId
        },
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

      return res.status(200).json(clothesWithParsedTags);
    } catch (error: any) {
      console.error('Error fetching clothes:', error);
      return res.status(500).json({ 
        message: error.message || 'Error fetching clothes' 
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 