import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid clothing item ID' });
  }

  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      // First fetch the item to get the image path
      const clothingItem = await prisma.clothes.findUnique({
        where: { id }
      });

      if (!clothingItem) {
        return res.status(404).json({ message: 'Clothing item not found' });
      }

      // Delete the clothing item from the database
      await prisma.clothes.delete({
        where: { id }
      });

      // Delete the image file if it exists
      if (clothingItem.imageUrl) {
        try {
          const imagePath = path.join(process.cwd(), 'public', clothingItem.imageUrl);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Deleted image file: ${imagePath}`);
          }
        } catch (fileError) {
          console.error('Error deleting image file:', fileError);
          // Continue even if file deletion fails
        }
      }

      return res.status(200).json({ message: 'Clothing item deleted successfully' });
    } catch (error) {
      console.error('Error deleting clothing item:', error);
      return res.status(500).json({ message: 'Error deleting clothing item' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
} 