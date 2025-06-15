
'use server';
/**
 * @fileOverview An AI-powered code analysis and fixing assistant.
 *
 * - fixCodeProblem - A function that takes a code snippet and problem description to suggest fixes.
 * - CodeFixerInput - The input type for the fixCodeProblem function.
 * - CodeFixerOutput - The return type for the fixCodeProblem function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CodeFixerInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet that needs to be analyzed or fixed.'),
  problemDescription: z.string().describe('A description of the problem or error in the code snippet.'),
});
export type CodeFixerInput = z.infer<typeof CodeFixerInputSchema>;

const CodeFixerOutputSchema = z.object({
  suggestedCode: z.string().describe('The suggested corrected or improved code snippet. This could be an empty string if no direct code fix is applicable.'),
  explanation: z.string().describe('An explanation of the identified problem, the suggested changes, and why they address the issue. This should always be provided.'),
});
export type CodeFixerOutput = z.infer<typeof CodeFixerOutputSchema>;

export async function fixCodeProblem(input: CodeFixerInput): Promise<CodeFixerOutput> {
  return codeFixerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeFixerPrompt',
  input: { schema: CodeFixerInputSchema },
  output: { schema: CodeFixerOutputSchema },
  prompt: `You are an expert AI programming assistant specializing in Next.js, React, TypeScript, Tailwind CSS, ShadCN UI, and Genkit.
The user has provided a code snippet and a description of a problem they are facing with it.

Your task is to:
1. Carefully analyze the provided code snippet and the problem description.
2. Identify the error(s), potential issues, or areas for improvement based on the description.
3. Provide a corrected or improved version of the code snippet in the 'suggestedCode' field. If a direct code fix isn't the primary solution (e.g., the problem is conceptual or requires external changes), you can provide a relevant code example or leave 'suggestedCode' empty.
4. Provide a clear and concise explanation in the 'explanation' field. This should detail what the problem was, how the suggested code (if any) addresses it, and any important considerations. Always provide an explanation.

Ensure your response is structured according to the output schema.

Problem Description:
{{{problemDescription}}}

Code Snippet:
\`\`\`
{{{codeSnippet}}}
\`\`\`

Respond with the suggested code and explanation.
`,
});

const codeFixerFlow = ai.defineFlow(
  {
    name: 'codeFixerFlow',
    inputSchema: CodeFixerInputSchema,
    outputSchema: CodeFixerOutputSchema,
  },
  async (input) => {
    if (!input.codeSnippet.trim() && !input.problemDescription.trim()) {
      return {
        suggestedCode: '',
        explanation: 'Please provide a code snippet and/or a problem description for analysis.',
      };
    }
    if (!input.codeSnippet.trim()) {
       return {
        suggestedCode: '',
        explanation: 'No code snippet provided. Based on the problem description: ' + input.problemDescription + '\n\nPlease provide the relevant code for a more specific fix.',
      };
    }
     if (!input.problemDescription.trim()) {
       return {
        suggestedCode: input.codeSnippet, // Return original code if no problem described
        explanation: 'No problem description provided. Please describe the issue with the code snippet.',
      };
    }

    const { output } = await prompt(input);
    if (!output) {
      return {
        suggestedCode: '',
        explanation: 'Sorry, I was unable to process your request at this time. Please try again.',
      };
    }
    return output;
  }
);
