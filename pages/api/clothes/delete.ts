import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    // Get the cloth details first
    const cloth = await prisma.clothes.findUnique({
      where: { id },
    });

    if (!cloth) {
      return res.status(404).json({ message: 'Cloth not found' });
    }

    // Delete the image file
    const imagePath = path.join(process.cwd(), 'public', cloth.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete from database
    await prisma.clothes.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Cloth deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting cloth' });
  }
} 