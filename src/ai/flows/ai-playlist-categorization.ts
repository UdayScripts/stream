'use server';
/**
 * @fileOverview An AI agent that categorizes IPTV channel names.
 *
 * - categorizePlaylist - A function that categorizes a list of IPTV channel names.
 * - CategorizePlaylistInput - The input type for the categorizePlaylist function.
 * - CategorizePlaylistOutput - The return type for the categorizePlaylist function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CategorizePlaylistInputSchema = z.object({
  channelNames: z.array(z.string()).describe('An array of IPTV channel names to categorize.'),
});
export type CategorizePlaylistInput = z.infer<typeof CategorizePlaylistInputSchema>;

const CategorizedChannelSchema = z.object({
  name: z.string().describe('The name of the channel.'),
  category: z.string().describe('The suggested category for the channel (e.g., "News", "Sports", "Movies", "Music", "Kids", "Documentary", "Entertainment", "Religious", "Local", "International", "Educational", "Lifestyle", "Shopping", "Adult", "General"). If no clear category exists, use "General".'),
});

const CategorizePlaylistOutputSchema = z.object({
  categorizedChannels: z.array(CategorizedChannelSchema).describe('A list of channels with their assigned categories.'),
});
export type CategorizePlaylistOutput = z.infer<typeof CategorizePlaylistOutputSchema>;

export async function categorizePlaylist(input: CategorizePlaylistInput): Promise<CategorizePlaylistOutput> {
  return categorizePlaylistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizePlaylistPrompt',
  input: { schema: CategorizePlaylistInputSchema },
  output: { schema: CategorizePlaylistOutputSchema },
  prompt: `You are an AI assistant specialized in categorizing IPTV channels. Your task is to analyze a list of channel names and assign a logical category to each.

Available categories include: "News", "Sports", "Movies", "Music", "Kids", "Documentary", "Entertainment", "Religious", "Local", "International", "Educational", "Lifestyle", "Shopping", "Adult", "General". If a channel name does not clearly fit into any specific category, assign it to "General".

For each channel name provided, return its original name and the suggested category in a JSON format that matches the output schema.

Here are the channel names to categorize:
{{#each channelNames}}
- {{{this}}}
{{/each}}`,
});

const categorizePlaylistFlow = ai.defineFlow(
  {
    name: 'categorizePlaylistFlow',
    inputSchema: CategorizePlaylistInputSchema,
    outputSchema: CategorizePlaylistOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to categorize playlist: No output from AI model.');
    }
    return output;
  }
);
