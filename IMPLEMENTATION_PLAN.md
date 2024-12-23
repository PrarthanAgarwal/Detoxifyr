# Detoxifyr Core Implementation Plan

## Current vs New Flow

### Current Flow
1. User enters keywords and preferences
2. YouTube search with combined keywords
3. Two-tier filtering:
   - High Quality Tier (strict)
   - Standard Tier (relaxed)
4. Basic scoring:
   - Engagement (likes, comments)
   - Authority (subscriber count, views)
   - Quality (HD, captions, description)
   - Relevancy (string matching)
5. Filter and display results

### Issues with Current Flow
1. GPT services defined but unused
2. Simplistic relevancy scoring
3. Incomplete service integration
4. No semantic understanding
5. Services working in isolation

## New Architecture

### 1. Search Enhancement Layer
```typescript
// New: src/services/search/EnhancedSearchService.ts
export class EnhancedSearchService {
  private semanticService: SemanticService;
  private youtubeService: YouTubeService;
  
  public async optimizeSearch(keywords: string[]): Promise<OptimizedQuery> {
    const optimizedQuery = await this.semanticService.optimizeSearchQuery(keywords);
    return optimizedQuery;
  }
  
  public async search(query: OptimizedQuery): Promise<SearchResults> {
    const results = await this.youtubeService.searchVideos(query);
    return results;
  }
}
```

### 2. Analysis Pipeline
```typescript
// Update: src/services/integration/integrationManager.ts
export class IntegrationManager {
  private services: {
    semantic: SemanticService;
    content: ContentAnalysisService;
    age: AgeAnalysisService;
  };
  
  public async analyzeVideo(video: Video, query: string): Promise<AnalysisResult> {
    const [semantic, content, age] = await Promise.all([
      this.services.semantic.analyzeSemanticRelevance(query, video),
      this.services.content.analyzeContent(video),
      this.services.age.analyzeTemporalRelevance(video)
    ]);
    
    return this.combineAnalysis(semantic, content, age);
  }
}
```

### 3. Enhanced Filtering
```typescript
// Update: src/services/filtering/SimplifiedFilteringEngine.ts
export class SimplifiedFilteringEngine {
  private integrationManager: IntegrationManager;
  
  private async calculateMetrics(
    videos: VideoDetails[],
    query: string
  ): Promise<Map<string, QualityMetrics>> {
    const analysisResults = await Promise.all(
      videos.map(video => 
        this.integrationManager.analyzeVideo(video, query)
      )
    );
    
    return this.convertAnalysisToMetrics(analysisResults);
  }
}
```

## Implementation Phases

### Phase 1: Search Enhancement
1. Update GPTService.ts:
   - Add new analysis types
   - Implement query optimization
   - Add semantic understanding

2. Modify SemanticService.ts:
   - Add query optimization
   - Enhance semantic analysis
   - Integrate with GPT

3. Create EnhancedSearchService.ts:
   - Implement search optimization
   - Add YouTube integration
   - Handle query expansion

### Phase 2: Analysis Integration
1. Update IntegrationManager.ts:
   - Implement parallel processing
   - Add service orchestration
   - Handle analysis combination

2. Enhance existing services:
   - SemanticService: Add relevancy scoring
   - ContentAnalysisService: Add quality analysis
   - AgeAnalysisService: Add temporal analysis

### Phase 3: Filtering Enhancement
1. Update SimplifiedFilteringEngine.ts:
   - Integrate with IntegrationManager
   - Enhance filtering criteria
   - Improve scoring system

2. Add new filtering features:
   - GPT-based relevancy
   - Enhanced quality metrics
   - Better ranking algorithm

## Files to Leverage

### Existing Files
1. `src/services/semantic/semanticService.ts`
   - Already has GPT integration
   - Good foundation for semantic analysis

2. `src/services/content/contentAnalysisService.ts`
   - Has analysis structure
   - Ready for GPT integration

3. `src/services/age/ageAnalysisService.ts`
   - Has temporal analysis
   - Can be enhanced with GPT

4. `src/services/integration/integrationManager.ts`
   - Perfect for central orchestration
   - Already handles service coordination

5. `src/services/filtering/SimplifiedFilteringEngine.ts`
   - Good filtering structure
   - Can be enhanced with new metrics

6. `src/components/EnhancedPreferencesForm.tsx`
   - Modern UI components
   - Ready for new preferences

### New Files Needed
1. `src/services/search/EnhancedSearchService.ts`
2. `src/services/analysis/AnalysisCombiner.ts`
3. `src/components/analysis/AnalysisResults.tsx`
4. `src/components/metrics/QualityMetrics.tsx`

## Implementation Order

1. **Foundation (Week 1)**
   - Set up EnhancedSearchService
   - Update GPTService
   - Modify SemanticService

2. **Analysis Layer (Week 2)**
   - Update IntegrationManager
   - Enhance analysis services
   - Implement AnalysisCombiner

3. **Filtering Layer (Week 3)**
   - Update SimplifiedFilteringEngine
   - Implement new metrics
   - Add GPT-based scoring

4. **UI Layer (Week 4)**
   - Update preferences form
   - Add new components
   - Implement results view

## Testing Strategy

1. **Unit Tests**
   - Test each service independently
   - Mock GPT responses
   - Verify scoring algorithms

2. **Integration Tests**
   - Test service combinations
   - Verify analysis pipeline
   - Check filtering accuracy

3. **E2E Tests**
   - Test complete flow
   - Verify UI integration
   - Check performance

## Performance Considerations

1. **Caching**
   - Cache GPT responses
   - Store analysis results
   - Cache search results

2. **Optimization**
   - Batch GPT requests
   - Parallel processing
   - Lazy loading

3. **Error Handling**
   - Graceful degradation
   - Fallback options
   - User feedback 