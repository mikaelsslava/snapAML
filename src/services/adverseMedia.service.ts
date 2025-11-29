/**
 * AdverseMediaService - Analyzes company reputation using DuckDuckGo and AI
 */

import { SafeSearchType, search } from 'duck-duck-scrape';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AdverseMediaResult {
  risk_score: number; // 0-100
  negative_mentions: number;
  summary: string;
  sources: string[];
  analyzed_at: string;
}

export interface AdverseMediaSearchResult {
  summary: string;
  urls: string[];
  risk_score: number;
  negative_mentions: number;
  adverse_findings: boolean;
}

export interface ClaudeAnalysisResponse {
  summary: string;
  risk_score: number; // 0-100
  negative_mentions: number;
  adverse_findings: boolean;
}

export class AdverseMediaService {
  private static anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  /**
   * Search for adverse media using DuckDuckGo and analyze with Claude
   * @param companyName - Company name to analyze
   * @returns Analysis summary and URLs
   */
  public static async searchAdverseMedia(companyName: string): Promise<AdverseMediaSearchResult> {
    try {
      console.log(`Searching adverse media for ${companyName}`);

      // Construct search query with financial crime terms
      const searchQuery = `"${companyName}" ("fraud" OR "money laundering" OR "sanction")`;
      
      console.log('Perform DuckDuckGo search')
      // Perform DuckDuckGo search
      const searchResults = await search(searchQuery, {
        safeSearch: SafeSearchType.OFF,
        time: 'y', // Past year
        locale: 'en-us'
      });

      // Extract top 5 results with title and snippet
      const top5Results = searchResults.results.slice(0, 5);
      
      if (top5Results.length === 0) {
        return {
          summary: 'No adverse media found',
          urls: [],
          risk_score: 0,
          negative_mentions: 0,
          adverse_findings: false
        };
      }

      // Prepare snippets for AI analysis
      const snippets = top5Results.map((result, index) => 
        `${index + 1}. Title: ${result.title}\n   Snippet: ${result.description}`
      ).join('\n\n');

      // Extract URLs
      const urls = top5Results.map(result => result.url);

      // Send to Claude for structured JSON analysis
      const prompt = `Analyze these search snippets for the company '${companyName}'. 

You must respond with ONLY a JSON object in this exact format:
{
  "summary": "Your analysis summary in 1-3 sentences",
  "risk_score": 0-100,
  "negative_mentions": number_of_actual_negative_findings,
  "adverse_findings": true_or_false
}

Guidelines:
- risk_score: 0-20 (low risk), 21-50 (medium), 51-80 (high), 81-100 (critical)
- negative_mentions: Count only results with actual adverse content about ${companyName}
- adverse_findings: true if any real financial crime concerns found, false otherwise
- If results look normal/irrelevant, set adverse_findings to false and risk_score to 0-20

Search Results:
${snippets}`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      
      try {
        // Parse Claude's JSON response
        const analysis: ClaudeAnalysisResponse = JSON.parse(responseText);
        
        return {
          summary: analysis.summary,
          urls: urls,
          risk_score: analysis.risk_score,
          negative_mentions: analysis.negative_mentions,
          adverse_findings: analysis.adverse_findings
        };
      } catch (parseError) {
        console.error('Failed to parse Claude response as JSON:', parseError);
        console.log('Raw response:', responseText);
        
        // Fallback to manual analysis
        return {
          summary: responseText.includes('No adverse media found') ? 'No adverse media found' : 'Analysis completed - manual review recommended',
          urls: urls,
          risk_score: responseText.includes('No adverse media found') ? 5 : 30,
          negative_mentions: responseText.includes('No adverse media found') ? 0 : urls.length,
          adverse_findings: !responseText.includes('No adverse media found')
        };
      }

    } catch (error) {
      console.error('Adverse media search failed:', error);
      return {
        summary: 'Search failed - manual review recommended',
        urls: [],
        risk_score: 50,
        negative_mentions: 0,
        adverse_findings: false
      };
    }
  }

  /**
   * Analyze company reputation from media sources (legacy method)
   * @param companyName - Company name to analyze
   * @returns AI analysis results
   */
  public static async analyzeReputation(companyName: string): Promise<AdverseMediaResult> {
    try {
      console.log(`Analyzing adverse media for ${companyName}`);

      // Use the new search method with Claude's structured analysis
      const searchResult = await this.searchAdverseMedia(companyName);
      
      // Use Claude's analysis data directly instead of making assumptions
      return {
        risk_score: searchResult.risk_score,
        negative_mentions: searchResult.negative_mentions,
        summary: searchResult.summary,
        sources: searchResult.urls,
        analyzed_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Adverse media analysis failed:', error);
      // Return safe defaults if analysis fails
      return {
        risk_score: 50, // Medium risk when check fails
        negative_mentions: 0,
        summary: 'Analysis failed - manual review recommended',
        sources: [],
        analyzed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate overall risk level based on risk score
   * @param riskScore - Risk score from 0-100
   * @returns Risk level description
   */
  public static getRiskLevel(riskScore: number): string {
    if (riskScore < 20) return 'LOW';
    if (riskScore < 50) return 'MEDIUM';
    if (riskScore < 80) return 'HIGH';
    return 'CRITICAL';
  }
}
