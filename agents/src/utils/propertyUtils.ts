/**
 * Utility functions for property and real estate data gathering
 */
export const propertyUtils = {
  /**
   * Get property records for a prospect
   * @param prospect The prospect to get property data for
   * @returns Property records data
   */
  async getPropertyRecords(prospect: any): Promise<any> {
    // In a real implementation, we'd connect to MLS, property data APIs, or public records
    // For now, we'll return realistic mock data based on prospect information

    try {
      // Base some values on prospect data if available
      const basePrice = prospect.averageSalePrice || 300000;
      const baseListings = prospect.listingsCount || 5;
      const baseVolume = prospect.yearlyTransactionVolume || 10;

      // Add some variance
      const priceVariance = 0.3; // ±30%
      const countVariance = 0.4; // ±40%

      const averageSalePrice = basePrice * (1 + (Math.random() - 0.5) * 2 * priceVariance);
      const listingsCount = Math.max(0, Math.round(baseListings * (1 + (Math.random() - 0.5) * 2 * countVariance)));
      const yearlyTransactionVolume = Math.max(0, Math.round(baseVolume * (1 + (Math.random() - 0.5) * 2 * countVariance)));

      // Generate mock property addresses
      const streetNames = ['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Washington', 'Lincoln'];
      const streetTypes = ['St', 'Ave', 'Rd', 'Blvd', 'Ln', 'Dr', 'Way', 'Ct'];
      const cities = ['Springfield', 'Franklin', 'Georgetown', 'Madison', 'Hamilton'];

      const recentListings = [];
      const recentSales = [];

      // Generate 0-3 recent listings
      const numListings = Math.min(listingsCount, Math.floor(Math.random() * 4));
      for (let i = 0; i < numListings; i++) {
        const street = streetNames[Math.floor(Math.random() * streetNames.length)];
        const type = streetTypes[Math.floor(Math.random() * streetTypes.length)];
        const num = Math.floor(Math.random() * 9900) + 100;
        const city = cities[Math.floor(Math.random() * cities.length)];
        recentListings.push(`${num} ${street} ${type}, ${city}`);
      }

      // Generate 0-3 recent sales
      const numSales = Math.min(yearlyTransactionVolume, Math.floor(Math.random() * 4));
      for (let i = 0; i < numSales; i++) {
        const street = streetNames[Math.floor(Math.random() * streetNames.length)];
        const type = streetTypes[Math.floor(Math.random() * streetTypes.length)];
        const num = Math.floor(Math.random() * 9900) + 100;
        const city = cities[Math.floor(Math.random() * cities.length)];
        recentSales.push(`${num} ${street} ${type}, ${city}`);
      }

      return {
        recentListings,
        recentSales,
        averageSalePrice: Math.round(averageSalePrice / 1000) * 1000, // Round to nearest thousand
        listingsCount,
        yearlyTransactionVolume,
        averageDaysOnMarket: Math.floor(Math.random() * 45) + 15, // 15-60 days
        priceReductionFrequency: Math.floor(Math.random() * 5), // 0-4 price reductions per listing on average
        pricePerSqFt: Math.round((averageSalePrice / 2000) / 10) * 10, // Assuming 2000 sq ft average
        totalValueListings: listingsCount * averageSalePrice,
        totalValueSales: yearlyTransactionVolume * averageSalePrice
      };
    } catch (error) {
      console.error(`Error getting property records:`, error);
      // Return empty/default data on error
      return {
        recentListings: [],
        recentSales: [],
        averageSalePrice: 0,
        listingsCount: 0,
        yearlyTransactionVolume: 0,
        averageDaysOnMarket: 0,
        priceReductionFrequency: 0,
        pricePerSqFt: 0,
        totalValueListings: 0,
        totalValueSales: 0
      };
    }
  }
};