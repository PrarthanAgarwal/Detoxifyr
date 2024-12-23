import { GPTErrorResponse } from '../../types/gpt.types';

export class GPTApiClient {
    private readonly apiKey: string;
    private readonly baseURL = 'https://api.openai.com/v1';
    private readonly model = 'gpt-4o-mini';  // GPT-4o mini model
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000;
    
    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async analyze(prompt: string, systemPrompt: string): Promise<any> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const startTime = Date.now();
                
                const response = await fetch(`${this.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: 'system',
                                content: systemPrompt
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.3,
                        max_tokens: 150,
                        response_format: { type: "json_object" }
                    })
                });

                const responseTime = Date.now() - startTime;
                console.debug(`GPT API response time: ${responseTime}ms`);

                if (!response.ok) {
                    const errorData: GPTErrorResponse = await response.json();
                    throw new Error(
                        `GPT API error (${response.status}): ${errorData.error.message}`
                    );
                }

                const data = await response.json();
                return this.extractResponseContent(data);

            } catch (error) {
                lastError = error as Error;
                
                // Don't retry on authentication errors
                if (error instanceof Error && 
                    error.message.includes('401')) {
                    throw error;
                }

                if (attempt === this.maxRetries) {
                    throw error;
                }

                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError || new Error('Failed to get GPT analysis');
    }

    private extractResponseContent(response: any): any {
        try {
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content in GPT response');
            }

            // Parse JSON content
            return JSON.parse(content);
        } catch (error) {
            console.error('Error parsing GPT response:', error);
            throw new Error('Invalid GPT response format');
        }
    }
} 