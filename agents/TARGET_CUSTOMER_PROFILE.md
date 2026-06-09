# Target Customer Profile for Real Estate Client Acquisition Agent

## Overview
This document defines the ideal customer profile for our hyperpersonalized client acquisition agent targeting real estate professionals. The profile guides prospecting, filtering, and personalization logic for the ProspectService.

## Industry Verticals
- **Primary Focus**: Real estate industry professionals
- **Specializations**:
  - Residential real estate agents (buyer's agents, seller's agents, dual agents)
  - Commercial real estate agents (office, retail, industrial, multifamily)
  - Property managers (residential and commercial)
  - Real estate brokers and team leaders
  - Real estate investors and flippers (individuals and small firms)
- **Exclusions**: 
  - Large real estate franchises (>100 agents)
  - Real estate technology vendors
  - Mortgage lenders and title companies (unless they also act as agents)

## Company Size Specifics
- **Individual Agents**: Solo practitioners (1 person)
  - Independent contractors or affiliate with brokerages
  - Typically handle 5-15 transactions per year
  - Personal brand focused
- **Small Teams**: 2-10 agents
  - Team structure with a leader and supporting agents
  - May have administrative assistants
  - Transaction volume: 20-100 deals per year
- **Small Brokerages**: 11-50 agents
  - Local or regional brokerage with multiple teams
  - May have office staff and marketing support
  - Transaction volume: 100-500 deals per year
- **Upper Limit**: 51-100 agents (extended threshold for scaling considerations)
  - Larger boutique brokerages
  - Beginning to invest in technology stacks

*Note: We target entities under 100 employees/agents as defined in the initial scope.*

## Tech Maturity Indicators
We target prospects demonstrating:
- **Basic Digital Presence**: 
  - Professional website (IDX-enabled or custom)
  - Active social media profiles (Facebook, Instagram, LinkedIn)
  - Email newsletter or CRM usage (even basic like Contactually, Follow Up Boss)
- **Adoption Triggers** (positive signals):
  - Using any CRM (Salesforce, HubSpot, Zoho, LionDesk, etc.)
  - Running paid online ads (Facebook/Google)
  - Utilizing transaction management platforms (Dotloop, SkySlope)
  - Experimenting with basic AI tools (chatbots, valuation estimators)
  - Subscribing to lead generation services (Zillow Premier Agent, Realtor.com)
- **Avoid**: 
  - Prospects with zero online presence
  - Those exclusively using offline methods (paper files, no website)
  - Enterprises with legacy systems resistant to change (indicating long sales cycles)

## Budget Range Considerations
- **Monthly Budget Range**: $50 - $500+/month for AI/marketing automation solutions
  - **Individual Agents**: $50-$150/month (price-sensitive, ROI-focused)
  - **Small Teams**: $150-$300/month (see value in team efficiency)
  - **Small Brokerages**: $300-$500+/month (departmental budgets available)
- **Purchase Triggers**:
  - Prospects currently spending on lead generation ($200-$1000+/month)
  - Those investing in website SEO/ads ($300-$800/month)
  - Agents attending real estate tech conferences or webinars
- **Price Sensitivity Notes**:
  - Emphasize time savings and lead conversion improvement
  - Offer tiered pricing (starter/growth/agency plans)
  - Avoid enterprise-length sales cycles; target quick-decision SMBs

## Decision Makers
- **Primary Decision Maker**: 
  - The individual real estate agent (for solos and team leaders)
  - In teams: The team leader or broker/owner
  - In brokerages: The managing broker or owner (sometimes with office manager influence)
- **Influencers**:
  - Top-producing agents within teams (can champion adoption)
  - Administrative/office managers (handle tech implementation)
  - Marketing coordinators (in larger brokerages)
- **Buying Characteristics**:
  - Decisions often made individually (not committee-based for <10 agents)
  - Quick trial-to-adoption cycle when value is demonstrated
  - Influenced by peer recommendations and industry testimonials
  - Responsive to limited-time offers and performance-based guarantees

## Implementation Guidelines for ProspectService
The target customer profile will be used to:
1. **Filter Prospects**: Exclude entities >100 agents, non-real estate, low digital presence
2. **Score Leads**: Assign points for tech maturity indicators (CRM usage, ad spending, etc.)
3. **Personalize Outreach**: 
   - Reference specific pain points by agent type (e.g., lead follow-up for busy agents)
   - Mention relevant integrations (with their current CRM/website)
   - Reference local market conditions when known
4. **Prioritize Efforts**: Focus on high-score prospects indicating budget readiness and tech openness

## Data Sources for Profiling
- Public websites and social media
- Real estate license databases (state-level)
- Technology usage tracking tools (BuiltWith, Wappalyzer)
- Lead enrichment services (Clearbit, ZoomInfo)
- Engagement history (website visits, content downloads)