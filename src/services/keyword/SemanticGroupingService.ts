import { KeywordGroup, SemanticGroupingConfig } from '../../types/semantic.types';
import { GPTService, GPTAnalysisOptions } from '../gpt/gptService';
import { LoggingService } from '../loggingService';

export class SemanticGroupingService {
    private static instance: SemanticGroupingService;
    private readonly gptService: GPTService;
    private readonly loggingService: LoggingService;
    private readonly defaultConfig: SemanticGroupingConfig = {
        maxGroupSize: 5,
        minSimilarityScore: 0.7,
        contextualBoost: true
    };

    constructor(
        gptService?: GPTService,
        loggingService?: LoggingService
    ) {
        this.gptService = gptService || GPTService.getInstance();
        this.loggingService = loggingService || LoggingService.getInstance();
    }

    public static getInstance(): SemanticGroupingService {
        if (!SemanticGroupingService.instance) {
            SemanticGroupingService.instance = new SemanticGroupingService();
        }
        return SemanticGroupingService.instance;
    }

    public async groupKeywords(
        keywords: string[],
        config: Partial<SemanticGroupingConfig> = {}
    ): Promise<KeywordGroup[]> {
        try {
            const mergedConfig = { ...this.defaultConfig, ...config };
            this.loggingService.log(`Starting keyword grouping process with ${keywords.length} keywords`);

            // Initial grouping based on semantic similarity
            const groups: KeywordGroup[] = [];
            const processedKeywords = new Set<string>();

            for (const keyword of keywords) {
                if (processedKeywords.has(keyword)) continue;

                try {
                    const group = await this.createKeywordGroup(
                        keyword,
                        keywords.filter(k => k !== keyword && !processedKeywords.has(k)),
                        mergedConfig
                    );

                    groups.push(group);
                    processedKeywords.add(keyword);
                    group.relatedKeywords.forEach(k => processedKeywords.add(k));
                } catch (error) {
                    // Log but continue processing other keywords
                    this.loggingService.logError('Error creating keyword group', error);
                }
            }

            // Optimize groups
            const optimizedGroups = await this.optimizeGroups(groups, mergedConfig);
            this.loggingService.log(`Completed keyword grouping with ${optimizedGroups.length} groups`);

            return optimizedGroups;
        } catch (error) {
            this.loggingService.logError('Error in keyword grouping', error);
            return keywords.map(keyword => ({
                primaryKeyword: keyword,
                relatedKeywords: [],
                weight: 1,
                semanticScore: 0.5
            }));
        }
    }

    private async createKeywordGroup(
        primaryKeyword: string,
        candidates: string[],
        config: SemanticGroupingConfig
    ): Promise<KeywordGroup> {
        try {
            const similarities = await Promise.all(
                candidates.map(async candidate => ({
                    keyword: candidate,
                    score: await this.calculateSimilarity(primaryKeyword, candidate)
                }))
            );

            const relatedKeywords = similarities
                .filter(({ score }) => score >= config.minSimilarityScore)
                .sort((a, b) => b.score - a.score)
                .slice(0, config.maxGroupSize - 1)
                .map(({ keyword }) => keyword);

            const averageScore = relatedKeywords.length > 0
                ? (await Promise.all(relatedKeywords.map(k => this.calculateSimilarity(primaryKeyword, k))))
                    .reduce((sum, score) => sum + score, 0) / relatedKeywords.length
                : 0.5;

            return {
                primaryKeyword,
                relatedKeywords,
                weight: 1,
                semanticScore: averageScore
            };
        } catch (error) {
            // Return a group with default values on error
            return {
                primaryKeyword,
                relatedKeywords: [],
                weight: 1,
                semanticScore: 0.5
            };
        }
    }

    private async optimizeGroups(
        groups: KeywordGroup[],
        config: SemanticGroupingConfig
    ): Promise<KeywordGroup[]> {
        // Sort groups by semantic score
        const sortedGroups = [...groups].sort((a, b) => 
            (b.semanticScore || 0) - (a.semanticScore || 0)
        );

        const mergedGroups: KeywordGroup[] = [];
        const processedGroups = new Set<KeywordGroup>();

        for (const group of sortedGroups) {
            if (processedGroups.has(group)) continue;

            let currentGroup = { ...group };
            processedGroups.add(group);

            // Find and merge all similar groups
            for (const otherGroup of sortedGroups) {
                if (processedGroups.has(otherGroup)) continue;

                const similarity = await this.calculateSimilarity(
                    currentGroup.primaryKeyword,
                    otherGroup.primaryKeyword
                );

                if (similarity >= config.minSimilarityScore) {
                    // Check if merging would exceed maxGroupSize
                    const totalSize = currentGroup.relatedKeywords.length + 
                                    otherGroup.relatedKeywords.length + 
                                    2; // +2 for both primary keywords

                    if (totalSize <= config.maxGroupSize) {
                        // Merge groups
                        currentGroup.relatedKeywords = [
                            ...new Set([
                                ...currentGroup.relatedKeywords,
                                otherGroup.primaryKeyword,
                                ...otherGroup.relatedKeywords
                            ])
                        ];
                        processedGroups.add(otherGroup);

                        // Update semantic score
                        currentGroup.semanticScore = await this.calculateGroupSemanticScore(currentGroup);
                    }
                }
            }

            mergedGroups.push(currentGroup);
        }

        return mergedGroups;
    }

    private async calculateGroupSemanticScore(group: KeywordGroup): Promise<number> {
        const allKeywords = [group.primaryKeyword, ...group.relatedKeywords];
        const scores: number[] = [];

        for (let i = 0; i < allKeywords.length; i++) {
            for (let j = i + 1; j < allKeywords.length; j++) {
                scores.push(await this.calculateSimilarity(allKeywords[i], allKeywords[j]));
            }
        }

        return scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 1;
    }

    public async calculateSimilarity(keyword1: string, keyword2: string): Promise<number> {
        try {
            const options: GPTAnalysisOptions = {
                type: 'semantic_similarity',
                query: `Compare the semantic similarity between "${keyword1}" and "${keyword2}"`,
            };

            const response = await this.gptService.analyzeContent(options);
            if (!response.similarityScore && response.similarityScore !== 0) {
                throw new Error('No similarity score returned from GPT service');
            }
            return response.similarityScore;
        } catch (error) {
            this.loggingService.logError('Error calculating keyword similarity', error);
            return 0.5;
        }
    }
} 