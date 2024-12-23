import { GPTService } from '../gpt/gptService';
import { LoggingService } from '../loggingService';
import { VideoDetails } from '../../types/youtube';
import { SemanticContent } from '../../types/semantic.types';

interface GPTRelevancyScore {
    score: number;
    confidence: number;
    aspects: {
        topicalRelevance: number;
        contextualRelevance: number;
        intentAlignment: number;
        contentDepth: number;
    };
    explanation: string[];
}

export class GPTRelevancyScoring {
    private static instance: GPTRelevancyScoring;
    private readonly gptService: GPTService;
    private readonly loggingService: LoggingService;

    private constructor() {
        this.gptService = GPTService.getInstance();
        this.loggingService = LoggingService.getInstance();
    }

    public static getInstance(): GPTRelevancyScoring {
        if (!GPTRelevancyScoring.instance) {
            GPTRelevancyScoring.instance = new GPTRelevancyScoring();
        }
        return GPTRelevancyScoring.instance;
    }

    public async analyzeRelevancy(
        video: VideoDetails,
        query: string,
        userContext?: Record<string, any>
    ): Promise<GPTRelevancyScore> {
        try {
            const content: SemanticContent = {
                title: video.title,
                description: video.description,
                tags: video.tags
            };

            const gptResponse = await this.gptService.analyzeContent({
                type: 'semantic_similarity',
                query: this.buildPrompt(query, content, userContext)
            });

            const aspects = this.analyzeAspects(gptResponse, content, query);
            const score = this.calculateOverallScore(aspects);

            return {
                score,
                confidence: gptResponse.similarityScore || 0.5,
                aspects,
                explanation: this.generateExplanation(aspects, content, query)
            };
        } catch (error) {
            this.loggingService.logError('Error in GPT relevancy analysis:', error);
            return this.getFallbackScore();
        }
    }

    private buildPrompt(
        query: string,
        content: SemanticContent,
        userContext?: Record<string, any>
    ): string {
        return `You are a content relevancy analyzer. Analyze how well this video content matches the user's search query.

SEARCH QUERY: "${query}"

CONTENT TO ANALYZE:
Title: ${content.title}
Description: ${content.description}
Tags: ${content.tags.join(', ')}
${userContext ? `\nUSER CONTEXT:\n${JSON.stringify(userContext, null, 2)}` : ''}

ANALYSIS CRITERIA:
1. Topical Relevance (0-1):
   - How closely does the content match the search topic?
   - Consider title, description, and tag matches
   - Account for semantic similarity and synonyms
   - Weight exact matches higher than partial matches

2. Contextual Alignment (0-1):
   - How well does the content fit the user's context?
   - Consider user preferences and requirements
   - Evaluate content format and style
   - Assess appropriateness for target audience

3. Intent Matching (0-1):
   - Does the content satisfy the search intent?
   - Identify if informational, tutorial, entertainment, etc.
   - Check if depth matches intent (overview vs detailed)
   - Evaluate if format matches intent (video length, style)

4. Content Depth (0-1):
   - How comprehensive is the content?
   - Assess detail level in description
   - Consider tag coverage and specificity
   - Evaluate information density

REQUIRED RESPONSE FORMAT:
{
    "topicalRelevance": number (0-1),
    "contextualRelevance": number (0-1),
    "intentAlignment": number (0-1),
    "contentDepth": number (0-1),
    "explanation": [
        "Key insight about topical relevance",
        "Key insight about contextual fit",
        "Key insight about intent matching",
        "Key insight about content depth"
    ]
}

Ensure each score is justified with specific examples from the content. Explanations should be clear and actionable.`;
    }

    private analyzeAspects(
        gptResponse: any,
        content: SemanticContent,
        query: string
    ): GPTRelevancyScore['aspects'] {
        // Extract aspects from GPT response or calculate fallbacks
        return {
            topicalRelevance: gptResponse.topicalRelevance || this.calculateTopicalRelevance(content, query),
            contextualRelevance: gptResponse.contextualRelevance || 0.5,
            intentAlignment: gptResponse.intentAlignment || 0.5,
            contentDepth: gptResponse.contentDepth || this.calculateContentDepth(content)
        };
    }

    private calculateTopicalRelevance(content: SemanticContent, query: string): number {
        const normalizedQuery = query.toLowerCase();
        const normalizedTitle = content.title.toLowerCase();
        const normalizedDesc = content.description.toLowerCase();
        const normalizedTags = content.tags.map(tag => tag.toLowerCase());

        const titleMatch = normalizedTitle.includes(normalizedQuery) ? 0.4 : 0;
        const descMatch = normalizedDesc.includes(normalizedQuery) ? 0.3 : 0;
        const tagMatch = normalizedTags.some(tag => tag.includes(normalizedQuery)) ? 0.3 : 0;

        return titleMatch + descMatch + tagMatch;
    }

    private calculateContentDepth(content: SemanticContent): number {
        const descriptionLength = content.description.length;
        const tagCount = content.tags.length;
        const hasDetailedDescription = descriptionLength > 200;
        const hasGoodTagCount = tagCount >= 5;

        return (
            (hasDetailedDescription ? 0.6 : 0.3) +
            (hasGoodTagCount ? 0.4 : 0.2)
        );
    }

    private calculateOverallScore(aspects: GPTRelevancyScore['aspects']): number {
        const weights = {
            topicalRelevance: 0.4,
            contextualRelevance: 0.2,
            intentAlignment: 0.2,
            contentDepth: 0.2
        };

        return (
            aspects.topicalRelevance * weights.topicalRelevance +
            aspects.contextualRelevance * weights.contextualRelevance +
            aspects.intentAlignment * weights.intentAlignment +
            aspects.contentDepth * weights.contentDepth
        );
    }

    private generateExplanation(
        aspects: GPTRelevancyScore['aspects'],
        content: SemanticContent,
        query: string
    ): string[] {
        const explanations: string[] = [];
        const normalizedQuery = query.toLowerCase();
        const normalizedTitle = content.title.toLowerCase();
        const normalizedDesc = content.description.toLowerCase();

        // Topical Relevance explanation
        if (aspects.topicalRelevance > 0.7) {
            const matchType = normalizedTitle.includes(normalizedQuery) 
                ? 'title matches'
                : normalizedDesc.includes(normalizedQuery)
                ? 'description matches'
                : 'tags match';
            explanations.push(`Content is highly relevant to "${query}" (${matchType})`);
        } else if (aspects.topicalRelevance > 0.4) {
            explanations.push(`Content is moderately relevant to "${query}"`);
        } else {
            explanations.push(`Content may not be directly relevant to "${query}"`);
        }

        // Content Depth explanation
        const descriptionLength = content.description.length;
        const tagCount = content.tags.length;
        if (aspects.contentDepth > 0.7) {
            explanations.push(
                `Content provides comprehensive information (${descriptionLength} chars description, ${tagCount} tags)`
            );
        } else if (aspects.contentDepth > 0.4) {
            explanations.push(
                `Content provides moderate detail (${descriptionLength} chars description)`
            );
        } else {
            explanations.push(
                `Content may lack sufficient detail (short description: ${descriptionLength} chars)`
            );
        }

        // Intent Alignment explanation
        if (aspects.intentAlignment > 0.7) {
            explanations.push(`Content aligns well with search intent for "${query}"`);
        } else if (aspects.intentAlignment > 0.4) {
            explanations.push(`Content partially aligns with search intent for "${query}"`);
        }

        // Contextual Relevance explanation
        if (aspects.contextualRelevance > 0.7) {
            explanations.push(`Content matches user preferences and context well`);
        } else if (aspects.contextualRelevance > 0.4) {
            explanations.push(`Content moderately matches user preferences`);
        }

        return explanations;
    }

    private getFallbackScore(): GPTRelevancyScore {
        return {
            score: 0.5,
            confidence: 0.5,
            aspects: {
                topicalRelevance: 0.5,
                contextualRelevance: 0.5,
                intentAlignment: 0.5,
                contentDepth: 0.5
            },
            explanation: ['Fallback scoring used due to analysis error']
        };
    }
} 