import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Gemini API client
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash';

if (!API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(API_KEY as string);

/**
 * Analyzes a clothing image and generates relevant tags
 * @param {Buffer} imageBuffer - The image buffer to analyze
 * @param {string} category - The clothing category (e.g., tops, bottoms)
 * @param {string} name - The name of the clothing item
 * @param {string[]} userTags - User-provided tags
 * @returns {Promise<string[]>} - A list of generated tags
 */
export async function analyzeClothingImage(
  imageBuffer: Buffer,
  category: string,
  name: string,
  userTags: string[] = []
): Promise<string[]> {
  try {
    // Get the generative model with the updated model name
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Create image part for the multimodal model
    const imagePart: Part = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg', // Assuming JPEG, adjust as necessary
      },
    };

    // Log what we're doing
    console.log(`Analyzing image for clothing item: ${name} (${category})`);
    console.log(`User-provided tags: ${userTags.length > 0 ? userTags.join(', ') : 'none'}`);

    // Simpler, clearer prompt for the model that asks for comma-separated values
    const prompt = `
    Analyze this clothing image. Details:
    - Category: ${category}
    - Name: ${name}
    ${userTags.length > 0 ? `- User tags: ${userTags.join(', ')}` : ''}
    
    Generate 5-10 tags for this clothing item covering:
    - Season appropriateness (summer, winter, fall, spring)
    - Occasions (casual, formal, party, work, etc.)
    - Style attributes (vintage, modern, classic, trendy, etc.)
    - Colors and patterns
    - Materials (when detectable)
    
    IMPORTANT: Return ONLY a comma-separated list of tags, nothing else.
    Example response: "summer, casual, floral, lightweight, cotton, blue, breathable, vacation"
    `;

    // Generate content from the model
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log('Gemini API response:', text);
    
    try {
      // First try to see if it returned a proper JSON array
      if (text.startsWith('[') && text.endsWith(']')) {
        try {
          const tags = JSON.parse(text) as string[];
          
          // Combine with user tags, remove duplicates, and convert to lowercase
          const allTags = Array.from(new Set([
            ...userTags.map(tag => tag.toLowerCase()),
            ...tags.map(tag => tag.toLowerCase())
          ]));
          
          console.log('AI-enhanced tags:', allTags);
          return allTags;
        } catch (e) {
          console.error('Failed direct JSON parse:', e);
          // Will fall through to comma-separated parsing
        }
      }
      
      // Process as comma-separated list (most likely response format)
      const tagsList = text
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);
      
      // Combine with user tags and remove duplicates
      const allTags = Array.from(new Set([
        ...userTags.map(tag => tag.toLowerCase()),
        ...tagsList
      ]));
      
      console.log(`AI-enhanced tags (${allTags.length}): ${allTags.join(', ')}`);
      return allTags;
    } catch (parseError) {
      console.error('Error parsing model response:', parseError);
      console.error('Raw response text:', text);
      return userTags;
    }
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    return userTags;
  }
} 