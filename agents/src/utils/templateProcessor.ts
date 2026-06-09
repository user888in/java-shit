export class TemplateProcessor {
  /**
   * Process a template string with prospect data
   * @param template The template string with placeholders like {{firstName}}
   * @param prospect The prospect data to use for replacement
   * @returns Processed string with placeholders replaced
   */
  process(template: string, prospect: any): string {
    if (!template) return '';

    let processed = template;

    // Replace standard prospect fields
    processed = processed.replace(/\{\{firstName\}\}/g, prospect.firstName || '');
    processed = processed.replace(/\{\{lastName\}\}/g, prospect.lastName || '');
    processed = processed.replace(/\{\{fullName\}\}/g, `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim());
    processed = processed.replace(/\{\{email\}\}/g, prospect.email || '');
    processed = processed.replace(/\{\{phone\}\}/g, prospect.phone || '');
    processed = processed.replace(/\{\{company\}\}/g, prospect.company || '');
    processed = processed.replace(/\{\{title\}\}/g, prospect.title || '');
    processed = processed.replace(/\{\{licenseNumber\}\}/g, prospect.licenseNumber || '');
    processed = processed.replace(/\{\{website\}\}/g, prospect.website || '');

    // Replace array fields (join with commas or use first item)
    processed = processed.replace(/\{\{specializations\}\}/g,
      Array.isArray(prospect.specializations) && prospect.specializations.length > 0
        ? prospect.specializations.join(', ')
        : '');

    processed = processed.replace(/\{\{primarySpecialization\}\}/g,
      Array.isArray(prospect.specializations) && prospect.specializations.length > 0
        ? prospect.specializations[0]
        : '');

    // Replace numeric fields
    processed = processed.replace(/\{\{listingsCount\}\}/g,
      prospect.listingsCount !== null && prospect.listingsCount !== undefined
        ? prospect.listingsCount.toString()
        : '');

    processed = processed.replace(/\{\{averageSalePrice\}\}/g,
      prospect.averageSalePrice !== null && prospect.averageSalePrice !== undefined
        ? `$${Number(prospect.averageSalePrice).toLocaleString()}`
        : '');

    processed = processed.replace(/\{\{yearlyTransactionVolume\}\}/g,
      prospect.yearlyTransactionVolume !== null && prospect.yearlyTransactionVolume !== undefined
        ? prospect.yearlyTransactionVolume.toString()
        : '');

    // Replace social media (first available or specific platform)
    processed = processed.replace(/\{\{linkedinProfile\}\}/g,
      Array.isArray(prospect.socialMediaProfiles) && prospect.socialMediaProfiles.length > 0
        ? prospect.socialMediaProfiles.find(profile => profile.includes('linkedin')) || prospect.socialMediaProfiles[0] || ''
        : '');

    // Replace intelligence data fields
    if (prospect.intelligenceData) {
      // Website analysis
      processed = processed.replace(/\{\{hasIdx\}\}/g,
        prospect.intelligenceData.hasIdx ? 'Yes' : 'No');

      processed = processed.replace(/\{\{leadCaptureForms\}\}/g,
        prospect.intelligenceData.leadCaptureForms !== null && prospect.intelligenceData.leadCaptureForms !== undefined
          ? prospect.intelligenceData.leadCaptureForms.toString()
          : '0');

      // Social media intelligence
      processed = processed.replace(/\{\{socialMediaEngagement\}\}/g,
        prospect.intelligenceData.socialMediaEngagement !== null && prospect.intelligenceData.socialMediaEngagement !== undefined
          ? `${(prospect.intelligenceData.socialMediaEngagement * 100).toFixed(1)}%`
          : '0%');

      processed = processed.replace(/\{\{postingFrequency\}\}/g,
        prospect.intelligenceData.postingFrequency !== null && prospect.intelligenceData.postingFrequency !== undefined
          ? prospect.intelligenceData.postingFrequency.toString()
          : '0');

      // Property data
      processed = processed.replace(/\{\{recentListings\}\}/g,
        Array.isArray(prospect.intelligenceData.recentListings) && prospect.intelligenceData.recentListings.length > 0
          ? prospect.intelligenceData.recentListings.slice(0, 3).join(', ')
          : 'None recently');

      processed = processed.replace(/\{\{recentSales\}\}/g,
        Array.isArray(prospect.intelligenceData.recentSales) && prospect.intelligenceData.recentSales.length > 0
          ? prospect.intelligenceData.recentSales.slice(0, 3).join(', ')
          : 'None recently');

      // Pain points
      processed = processed.replace(/\{\{painPoints\}\}/g,
        Array.isArray(prospect.intelligenceData.painPoints) && prospect.intelligenceData.painPoints.length > 0
          ? prospect.intelligenceData.painPoints.slice(0, 3).join(', ')
          : 'None identified');

      // Tech stack
      processed = processed.replace(/\{\{currentCRM\}\}/g,
        prospect.intelligenceData.techStack && prospect.intelligenceData.techStack.crm
          ? prospect.intelligenceData.techStack.crm
          : 'Unknown');

      processed = processed.replace(/\{\{emailMarketingTool\}\}/g,
        prospect.intelligenceData.techStack && prospect.intelligenceData.techStack.emailMarketing
          ? prospect.intelligenceData.techStack.emailMarketing
          : 'None detected');

      // Business info
      processed = processed.replace(/\{\{teamSize\}\}/g,
        prospect.intelligenceData.teamSize !== null && prospect.intelligenceData.teamSize !== undefined
          ? prospect.intelligenceData.teamSize.toString()
          : '1 (Solo agent)');

      processed = processed.replace(/\{\{yearsExperience\}\}/g,
        prospect.intelligenceData.yearsExperience !== null && prospect.intelligenceData.yearsExperience !== undefined
          ? prospect.intelligenceData.yearsExperience.toString()
          : 'Unknown');

      // Local market info
      processed = processed.replace(/\{\{localMarketTrend\}\}/g,
        prospect.intelligenceData.localMarketTrend || 'stable');

      processed = processed.replace(/\{\{competitiveAdvantageOpportunity\}\}/g,
        prospect.intelligenceData.competitiveAdvantageOpportunity || 'technology upgrade');

      // Event participation
      processed = processed.replace(/\{\{recentEvent\}\}/g,
        Array.isArray(prospect.intelligenceData.eventParticipation) && prospect.intelligenceData.eventParticipation.length > 0
          ? prospect.intelligenceData.eventParticipation[0]
          : 'None recently');

      // Awards/recognition
      processed = processed.replace(/\{\{recentAward\}\}/g,
        Array.isArray(prospect.intelligenceData.awards) && prospect.intelligenceData.awards.length > 0
          ? prospect.intelligenceData.awards[0]
          : 'None recently');
    }

    // Clean up any remaining unused placeholders (optional)
    processed = processed.replace(/\{\{[^}]+\}\}/g, '[Data not available]');

    return processed.trim();
  }
}