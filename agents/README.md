# Real Estate Client Acquisition Agent

A hyperpersonalized client acquisition agent designed specifically for real estate professionals. This agent finds real estate agents and agencies, researches them deeply, and engages them with tailored outreach across email and LinkedIn channels.

## Features

- **Prospect Identification**: Find real estate professionals from multiple sources (LinkedIn, MLS, websites, etc.)
- **Deep Intelligence Gathering**: Research prospects' professional background, digital footprint, business intelligence, and pain points
- **Hyperpersonalized Messaging**: Generate customized messages based on gathered intelligence
- **Multi-Channel Outreach**: Coordinated email and LinkedIn sequences with optimal timing
- **Response Handling**: Process and learn from responses to improve future outreach
- **Analytics & Reporting**: Track performance metrics and optimize campaigns
- **Background Processing**: Queue-based system for scalable operations

## Architecture

The application follows a modular microservices architecture with:

- **ProspectService**: Identification and management of prospects
- **IntelligenceService**: Data gathering and enrichment
- **PersonalizationService**: Message generation and customization
- **OutreachService**: Multi-channel sequencing and sending
- **ResponseService**: Response processing and learning
- **Workers**: Background jobs for prospecting, research, and outreach
- **API Controllers**: REST endpoints for all functionality
- **Database**: PostgreSQL with TypeORM ORM
- **Queues**: Redis-backed Bull queues for background processing

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 15.x or higher
- Redis 7.x or higher

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Initialize the database:
   ```bash
   npm run migrate
   ```

5. Start the application:
   ```bash
   npm run dev
   ```

### Docker Deployment

```bash
docker-compose up -d
```

## API Endpoints

### Prospects
- `GET /api/prospects` - List prospects with filtering
- `GET /api/prospects/:id` - Get a specific prospect
- `POST /api/prospects` - Create a new prospect
- `PUT /api/prospects/:id` - Update a prospect
- `DELETE /api/prospects/:id` - Delete a prospect
- `GET /api/prospects/:id/enrich` - Enrich prospect with intelligence data
- `POST /api/prospects/search` - Search prospects by criteria

### Campaigns
- `POST /api/campaigns` - Create a new campaign
- `PUT /api/campaigns/:id/start` - Start a campaign
- `PUT /api/campaigns/:id/pause` - Pause a campaign
- `PUT /api/campaigns/:id/complete` - Complete a campaign
- `PUT /api/campaigns/:id/cancel` - Cancel a campaign
- `GET /api/campaigns/:id` - Get campaign details
- `GET /api/campaigns/:id/analytics` - Get campaign analytics
- `POST /api/campaigns/:id/outreach` - Send outreach to a prospect
- `POST /api/campaigns/inbound` - Process inbound response

### Analytics
- `GET /api/analytics/prospect/:id` - Get prospect analytics
- `GET /api/analytics/campaign/:id` - Get campaign analytics
- `GET /api/analytics/overview` - Get overview analytics
- `GET /api/analytics/top-prospects` - Get top performing prospects
- `GET /api/analytics/conversion-funnel` - Get conversion funnel

## Environment Variables

See `.env.example` for all available configuration options.

## Worker Processes

The system uses three background workers:
- **ProspectingWorker**: Identifies new prospects from various sources
- **ResearchWorker**: Gathers intelligence on prospects
- **OutreachWorker**: Sends email and LinkedIn messages

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## License

MIT