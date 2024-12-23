import { GPTAnalysisRequest } from '../../types/gpt.types';

export class PromptManager {
    private static readonly SYSTEM_PROMPT = 
        'You are a video content analysis assistant. ' +
        'Analyze content objectively and provide numerical scores. ' +
        'Always respond in valid JSON format with scores between 0 and 1.';

    private static readonly PROMPT_TEMPLATES = {
        relevancyAnalysis: `Analyze the relevance between the search query and video content:
Query: {query}
Title: {title}
Description: {description}
Tags: {tags}

Provide a structured analysis with these components:
1. semanticScore: Semantic relevance (0-1)
2. topicRelevance: Topic alignment (0-1)
3. intentAlignment: Query intent match (0-1)
4. contextScore: Context relevance (0-1)

Response format:
{
    "semanticScore": number,
    "topicRelevance": number,
    "intentAlignment": number,
    "contextScore": number
}`,

        contentTypeAnalysis: `Analyze the video content type and quality:
Title: {title}
Description: {description}
Duration: {duration}

Provide a structured analysis with these components:
1. contentType: Type of content (e.g., "tutorial", "entertainment", "educational")
2. temporalRelevance: How time-sensitive the content is (0-1)
3. qualityIndicators: {
    isClickbait: boolean,
    contentQuality: number (0-1),
    informationDensity: number (0-1)
}

Response format:
{
    "contentType": string,
    "temporalRelevance": number,
    "qualityIndicators": {
        "isClickbait": boolean,
        "contentQuality": number,
        "informationDensity": number
    }
}`,

        enhancedContentAnalysis: `Analyze the content type and target audience:
Title: {title}
Description: {description}
Duration: {duration}
Tags: {tags}

Determine:
1. Primary content type
2. Sub-categories
3. Target audience level
4. Prerequisites
5. Intended use cases

Response format:
{
    "primaryType": string,
    "subTypes": string[],
    "confidence": number,
    "targetAudience": {
        "level": string,
        "prerequisites": string[],
        "intendedUse": string[]
    }
}`,

        durationAnalysis: `Analyze the expected duration range:
Content Type: {contentType}
Title: {title}
Description: {description}

Determine:
1. Expected duration range
2. Content complexity
3. Pacing assessment
4. Completeness likelihood

Response format:
{
    "expectedMinDuration": number,
    "expectedMaxDuration": number,
    "complexityLevel": number,
    "pacing": {
        "type": string,
        "score": number
    },
    "completeness": number
}`,

        metadataQuality: `Analyze metadata quality and completeness:
Title: {title}
Description: {description}
Tags: {tags}
Thumbnail Text: {thumbnailText}

Evaluate:
1. Title effectiveness
2. Description completeness
3. Tag relevance
4. Missing elements
5. Improvement suggestions

Response format:
{
    "titleQuality": {
        "score": number,
        "issues": string[],
        "suggestions": string[]
    },
    "descriptionQuality": {
        "score": number,
        "completeness": number,
        "structureScore": number,
        "missingElements": string[]
    },
    "tagsQuality": {
        "relevance": number,
        "coverage": number,
        "suggestedTags": string[]
    }
}`,

        deepSemanticAnalysis: `Perform a deep semantic analysis between the query and content:
Query: {query}
Content: {content}

Analyze:
1. Core semantic relationship
2. Topic hierarchy and categorization
3. Cross-lingual semantic equivalence
4. Contextual relevance factors

Response format:
{
    "semanticScore": number,
    "confidenceScore": number,
    "topicCategories": string[],
    "keywordRelevance": Record<string, number>,
    "languageContext": {
        "detectedLanguage": string,
        "crossLingualScore": number
    }
}`,

        intentClassification: `Classify the search intent and user goals:
Query: {query}
User Context: {context}

Determine:
1. Primary search intent
2. Secondary intents
3. Likely user goals
4. Confidence score

Response format:
{
    "primaryIntent": string,
    "secondaryIntents": string[],
    "intentConfidence": number,
    "userGoals": string[]
}`,

        temporalAnalysis: `Analyze the temporal relevance of the content:
Topic: {topic}
Content Type: {contentType}
Publish Date: {publishDate}
Last Update: {lastUpdate}
Query Context: {query}

Determine:
1. Topic volatility
2. Content freshness requirements
3. Optimal age thresholds
4. Update frequency needs

Response format:
{
    "temporalRelevance": number,
    "contentFreshness": number,
    "timelinessFactors": {
        "topicVolatility": number,
        "contentType": string,
        "updateFrequency": string,
        "lastRelevantDate": string
    },
    "ageThresholds": {
        "optimal": number,
        "acceptable": number,
        "maximum": number
    }
}`,

        topicVolatilityAnalysis: `Analyze the volatility of the following topic:
Topic: {topic}

Consider:
1. Rate of change in the field
2. Technological dependencies
3. Industry standards evolution
4. Community update frequency

Response format:
{
    "volatility": number,        // 0-1 score
    "changeRate": string,        // "rapid", "moderate", "slow"
    "factors": string[],         // List of volatility factors
    "updateFrequency": string    // Recommended update frequency
}`,

        freshnessEvaluation: `Evaluate content freshness and relevance:
Content Age: {age}
Topic Category: {category}
Engagement Metrics: {metrics}

Assess:
1. Current relevance
2. Freshness score
3. Need for updates
4. Engagement impact

Response format:
{
    "isFresh": boolean,
    "freshnessScore": number,
    "factors": string[],
    "recommendation": string
}`
    };

    public static getSystemPrompt(): string {
        return this.SYSTEM_PROMPT;
    }

    public static getPrompt(type: keyof typeof PromptManager.PROMPT_TEMPLATES, request: GPTAnalysisRequest): string {
        let template = this.PROMPT_TEMPLATES[type];
        
        // Replace all placeholders with actual values
        const params: Record<string, string> = {
            title: request.title || '',
            description: request.description || '',
            query: request.query || '',
            tags: (request.tags || []).join(', '),
            duration: request.duration || ''
        };

        Object.entries(params).forEach(([key, value]) => {
            template = template.replace(`{${key}}`, value);
        });

        return template;
    }

    public static validateResponse(response: any): boolean {
        try {
            if (typeof response !== 'object' || response === null) {
                return false;
            }

            // Validate relevancy analysis response
            if ('semanticScore' in response && 'topicRelevance' in response) {
                return this.validateScores([
                    response.semanticScore,
                    response.topicRelevance,
                    response.intentAlignment,
                    response.contextScore
                ]);
            }

            // Validate original content type analysis response
            if ('contentType' in response && 'temporalRelevance' in response) {
                return (
                    typeof response.contentType === 'string' &&
                    this.validateScores([response.temporalRelevance]) &&
                    this.validateQualityIndicators(response.qualityIndicators)
                );
            }

            // Validate enhanced content type analysis response
            if ('primaryType' in response && 'targetAudience' in response) {
                return this.validateContentTypeResponse(response);
            }

            // Validate duration analysis response
            if ('expectedMinDuration' in response && 'expectedMaxDuration' in response) {
                return this.validateDurationResponse(response);
            }

            // Validate metadata quality response
            if ('titleQuality' in response && 'descriptionQuality' in response) {
                return this.validateMetadataResponse(response);
            }

            // Validate semantic analysis response
            if ('confidenceScore' in response && 'topicCategories' in response) {
                return (
                    this.validateScores([
                        response.semanticScore,
                        response.confidenceScore,
                        response.languageContext?.crossLingualScore
                    ]) &&
                    Array.isArray(response.topicCategories) &&
                    typeof response.keywordRelevance === 'object'
                );
            }

            // Validate intent classification response
            if ('primaryIntent' in response && 'intentConfidence' in response) {
                return (
                    typeof response.primaryIntent === 'string' &&
                    Array.isArray(response.secondaryIntents) &&
                    Array.isArray(response.userGoals) &&
                    this.validateScores([response.intentConfidence])
                );
            }

            return false;
        } catch (error) {
            console.error('Error validating GPT response:', error);
            return false;
        }
    }

    private static validateScores(scores: number[]): boolean {
        return scores.every(score => 
            typeof score === 'number' && 
            !isNaN(score) && 
            score >= 0 && 
            score <= 1
        );
    }

    private static validateQualityIndicators(indicators: any): boolean {
        return (
            typeof indicators === 'object' &&
            typeof indicators.isClickbait === 'boolean' &&
            this.validateScores([
                indicators.contentQuality,
                indicators.informationDensity
            ])
        );
    }

    private static validateContentTypeResponse(response: any): boolean {
        return (
            typeof response.primaryType === 'string' &&
            Array.isArray(response.subTypes) &&
            typeof response.confidence === 'number' &&
            typeof response.targetAudience === 'object' &&
            typeof response.targetAudience.level === 'string' &&
            Array.isArray(response.targetAudience.prerequisites) &&
            Array.isArray(response.targetAudience.intendedUse)
        );
    }

    private static validateDurationResponse(response: any): boolean {
        return (
            typeof response.expectedMinDuration === 'number' &&
            typeof response.expectedMaxDuration === 'number' &&
            typeof response.complexityLevel === 'number' &&
            typeof response.pacing === 'object' &&
            typeof response.pacing.type === 'string' &&
            typeof response.pacing.score === 'number' &&
            typeof response.completeness === 'number'
        );
    }

    private static validateMetadataResponse(response: any): boolean {
        return (
            typeof response.titleQuality === 'object' &&
            typeof response.titleQuality.score === 'number' &&
            Array.isArray(response.titleQuality.issues) &&
            Array.isArray(response.titleQuality.suggestions) &&
            typeof response.descriptionQuality === 'object' &&
            typeof response.descriptionQuality.score === 'number' &&
            typeof response.descriptionQuality.completeness === 'number' &&
            typeof response.descriptionQuality.structureScore === 'number' &&
            Array.isArray(response.descriptionQuality.missingElements) &&
            typeof response.tagsQuality === 'object' &&
            typeof response.tagsQuality.relevance === 'number' &&
            typeof response.tagsQuality.coverage === 'number' &&
            Array.isArray(response.tagsQuality.suggestedTags)
        );
    }

    public static getTemporalAnalysisPrompt(params: {
        topic: string;
        contentType: string;
        publishDate: string;
        lastUpdate?: string;
        query: string;
    }): string {
        return this.formatPrompt('temporalAnalysis', params);
    }

    public static getTopicVolatilityPrompt(topic: string): string {
        return this.formatPrompt('topicVolatilityAnalysis', { topic });
    }

    public static getFreshnessEvaluationPrompt(params: {
        age: number;
        category: string;
        metrics: string;
    }): string {
        return this.formatPrompt('freshnessEvaluation', params);
    }

    private static formatPrompt(templateName: keyof typeof PromptManager.PROMPT_TEMPLATES, params: Record<string, any>): string {
        const template = this.PROMPT_TEMPLATES[templateName];
        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }
        
        return Object.entries(params).reduce(
            (acc, [key, value]) => acc.replace(`{${key}}`, value?.toString() || ''),
            template
        );
    }
} 