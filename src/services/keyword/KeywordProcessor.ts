import { ProcessedKeywords, ValidationResult, OptimizedKeywords } from '../../types';

export interface IKeywordProcessor {
  process(keywords: string[]): ProcessedKeywords;
  validate(keywords: string[]): ValidationResult;
  optimize(keywords: ProcessedKeywords): OptimizedKeywords;
}

export interface KeywordValidator {
  validate(keywords: string[]): ValidationResult;
}

export interface KeywordOptimizer {
  optimize(keywords: ProcessedKeywords): OptimizedKeywords;
}

export interface KeywordFormatter {
  format(keywords: string[]): string;
}

export class KeywordProcessor implements IKeywordProcessor {
  private static instance: KeywordProcessor;
  private readonly validator: KeywordValidator;
  private readonly optimizer: KeywordOptimizer;
  private readonly formatter: KeywordFormatter;

  private constructor() {
    this.validator = new DefaultKeywordValidator();
    this.optimizer = new DefaultKeywordOptimizer();
    this.formatter = new DefaultKeywordFormatter();
  }

  public static getInstance(): KeywordProcessor {
    if (!KeywordProcessor.instance) {
      KeywordProcessor.instance = new KeywordProcessor();
    }
    return KeywordProcessor.instance;
  }

  public process(keywords: string[]): ProcessedKeywords {
    const validationResult = this.validate(keywords);
    if (!validationResult.isValid) {
      return {
        originalKeywords: keywords,
        processedKeywords: [],
        errors: validationResult.errors
      };
    }

    const processedKeywords = keywords
      .map(k => k.trim().toLowerCase())
      .map(k => this.formatter.format(k.split(' ')));
      
    return {
      originalKeywords: keywords,
      processedKeywords,
      errors: []
    };
  }

  public validate(keywords: string[]): ValidationResult {
    return this.validator.validate(keywords);
  }

  public optimize(keywords: ProcessedKeywords): OptimizedKeywords {
    return this.optimizer.optimize(keywords);
  }
}

class DefaultKeywordValidator implements KeywordValidator {
  public validate(keywords: string[]): ValidationResult {
    const errors: string[] = [];
    const isValid = keywords.every(keyword => {
      if (!keyword.trim()) {
        errors.push('Empty keywords are not allowed');
        return false;
      }
      if (keyword.length > 50) {
        errors.push(`Keyword "${keyword}" is too long (max 50 characters)`);
        return false;
      }
      return true;
    });

    return { isValid, errors };
  }
}

class DefaultKeywordOptimizer implements KeywordOptimizer {
  public optimize(keywords: ProcessedKeywords): OptimizedKeywords {
    return {
      ...keywords,
      optimizedKeywords: keywords.processedKeywords,
      weights: keywords.processedKeywords.map(() => 1),
      groups: [keywords.processedKeywords]
    };
  }
}

class DefaultKeywordFormatter implements KeywordFormatter {
  public format(keywords: string[]): string {
    return keywords.join(' ');
  }
} 