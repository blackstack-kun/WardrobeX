import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI client
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}
const genAI = new GoogleGenerativeAI(API_KEY as string);
const MODEL_NAME = 'gemini-1.5-flash';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, weather, season, occasion, additionalInfo } = req.body;

    if (!userId || !weather || !season || !occasion) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Fetch user's clothing items from the database
    const userClothes = await prisma.clothes.findMany({
      where: { userId },
    });

    if (userClothes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No clothing items found. Please add some clothes to your wardrobe first.' 
      });
    }

    // Prepare clothing items data for Gemini
    const clothingData = userClothes.map(item => {
      let tags = [];
      try {
        // Parse tags if they are stored as a JSON string
        if ('tagsText' in item && item.tagsText) {
          tags = JSON.parse(item.tagsText as string);
        } else if (Array.isArray(item.tags)) {
          tags = item.tags;
        }
      } catch (error) {
        console.error('Error parsing tags:', error);
        tags = [];
      }

      return {
        id: item.id,
        name: item.name || 'Unnamed Item',
        category: item.category,
        tags: tags,
        imageUrl: item.imageUrl
      };
    });

    // Group clothing by category for easier processing
    const topItems = clothingData.filter(item => item.category === 'tops' || item.category === 'top');
    const bottomItems = clothingData.filter(item => item.category === 'bottoms' || item.category === 'bottom');
    const shoesItems = clothingData.filter(item => item.category === 'shoes');

    // Check if we have enough items for a recommendation
    if (topItems.length === 0 || bottomItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Not enough variety in your wardrobe. Please add more tops and bottoms.' 
      });
    }

    // Construct the prompt for Gemini
    const prompt = `
    I need an outfit recommendation based on the following requirements:
    - Weather: ${weather}
    - Season: ${season}
    - Occasion: ${occasion}
    ${additionalInfo ? `- Additional preferences: ${additionalInfo}` : ''}

    Here are the clothing items available in the user's wardrobe:

    TOPS (${topItems.length} items):
    ${topItems.map(item => `- ID: ${item.id}, Name: "${item.name}", Tags: [${item.tags.join(', ')}]`).join('\n')}

    BOTTOMS (${bottomItems.length} items):
    ${bottomItems.map(item => `- ID: ${item.id}, Name: "${item.name}", Tags: [${item.tags.join(', ')}]`).join('\n')}

    SHOES (${shoesItems.length} items):
    ${shoesItems.length > 0 
      ? shoesItems.map(item => `- ID: ${item.id}, Name: "${item.name}", Tags: [${item.tags.join(', ')}]`).join('\n')
      : 'No shoes available'
    }

    Based on these requirements and available items, create the perfect outfit by selecting one top, one bottom, and one pair of shoes (if available).
    
    Consider the following when making your recommendation:
    1. Weather appropriateness - select items suitable for ${weather} weather
    2. Season compatibility - the outfit should be appropriate for ${season}
    3. Occasion suitability - the style should match ${occasion} settings
    4. Color coordination and style matching between items
    5. Take into account the additional preferences: ${additionalInfo || 'None specified'}

    IMPORTANT: Your task is to generate a valid JSON response. The response MUST be valid JSON that can be parsed with JSON.parse().
    
    Format your response as a VALID JSON object with these exact fields (no other text):
    {
      "name": "A creative name for the outfit",
      "description": "A brief description of the outfit and why it works well for the given requirements",
      "top": {
        "id": "ID of the selected top"
      },
      "bottom": {
        "id": "ID of the selected bottom"
      },
      "shoes": {
        "id": "ID of the selected shoes or null if no suitable shoes"
      },
      "occasion": "${occasion}",
      "weather": "${weather}",
      "season": "${season}"
    }

    REMEMBER: Return ONLY the JSON object above, correctly formatted with double quotes around property names and string values. Do not include any explanations, markdown formatting, or other text.
    `;

    // Call the Gemini API
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    try {
      console.log("Raw response from Gemini:", response.text());
      
      // Try to extract JSON from the response
      const responseText = response.text();
      let parsedResponse;
      
      try {
        // First try: direct JSON parsing
        parsedResponse = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Failed to parse direct JSON, attempting to extract JSON from text:", jsonError);
        
        // Second try: extract JSON using regex
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            console.error("Failed to parse extracted JSON:", extractError);
            throw new Error("Could not parse JSON from response");
          }
        } else {
          throw new Error("No JSON object found in response");
        }
      }
      
      console.log("Parsed response:", parsedResponse);
      
      // Validate the response has the required fields
      if (!parsedResponse.top || !parsedResponse.bottom) {
        throw new Error("Missing required outfit items in response");
      }
      
      // Find the full details of the recommended items
      const topItemDetails = topItems.find(item => item.id === parsedResponse.top.id);
      const bottomItemDetails = bottomItems.find(item => item.id === parsedResponse.bottom.id);
      let shoesItemDetails = null;
      
      if (parsedResponse.shoes && parsedResponse.shoes.id) {
        shoesItemDetails = shoesItems.find(item => item.id === parsedResponse.shoes.id);
      }

      // Validate that the recommended items were found
      if (!topItemDetails || !bottomItemDetails) {
        throw new Error('Could not find all recommended items in your wardrobe');
      }
      
      // Fill in missing fields with defaults if necessary
      const recommendation = {
        name: parsedResponse.name,
        description: parsedResponse.description,
        top: topItemDetails,
        bottom: bottomItemDetails,
        shoes: shoesItemDetails,
        occasion: parsedResponse.occasion || occasion,
        weather: parsedResponse.weather || weather, 
        season: parsedResponse.season || season
      };
      
      return res.status(200).json({ success: true, outfit: recommendation });
    } catch (error: any) {
      console.error("Error generating recommendation:", error);
      console.error("Raw response text:", response.text());
      return res.status(500).json({ 
        success: false, 
        error: "Failed to generate a valid recommended outfit",
        details: error.message
      });
    }

  } catch (error) {
    console.error('Recommendation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while generating your outfit recommendation' 
    });
  }
} 