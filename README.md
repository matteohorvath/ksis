# KSIS MTASZ Website

## Overview

This repository contains the source code for the KSIS MTASZ website, a comprehensive dance sport management system. The platform serves as a central hub for managing dance competitions, rankings, and participant information in Hungary. Built with Next.js, it provides a robust and performant web application with server-side rendering capabilities.

## Features

### Core Functionality

1. **Event Calendar** (Eseménynaptár)
   - Comprehensive calendar of dance competitions and events
   - Detailed event information and schedules

2. **Competition Results** (Versenyeredmények)
   - Competition results database
   - Photo album integration for events
   - Results filtering by competition type and category

3. **Rankings** (Ranglista)
   - Dancer rankings and statistics
   - Performance tracking across competitions

4. **WDSF Integration**
   - WDSF competition results
   - WDSF rankings integration
   - International competition data

5. **Membership Management** (Tagság)
   - Competitor profiles and registration
   - Dance couple management
   - Formation team management
   - Officials database (judges, scrutineers)
   - Score keepers management

### Competition Categories

- Age Groups:
  - Children (Gyermek)
  - Junior I & II
  - Youth (Ifjúsági)
  - Adult (Felnőtt)
  - Senior

- Dance Categories:
  - Standard
  - Latin
  - Ten Dance (Tíztánc)

- Skill Levels:
  - E (Beginner)
  - D (Basic)
  - C (Intermediate)
  - B (Advanced)
  - A (Expert)

### Multilingual Support

- Hungarian (Magyar)
- English
- Slovak (Slovensky)

## Technology Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Package Manager**: Yarn
- **Deployment**: Vercel-ready configuration
- **Database**: [Specify database technology]
- **Authentication**: User login system with role-based access

## Project Structure

```
├── .next/               # Next.js build output
├── node_modules/        # Project dependencies
├── public/             # Static assets
├── src/
│   ├── app/           # App router components and pages
│   │   ├── calendar/  # Event calendar functionality
│   │   ├── results/   # Competition results
│   │   ├── rankings/  # Ranking system
│   │   ├── wdsf/      # WDSF integration
│   │   └── members/   # Membership management
│   ├── components/    # Reusable React components
│   ├── lib/          # Utility functions and shared logic
│   ├── styles/       # Global styles and CSS modules
│   └── types/        # TypeScript type definitions
├── .env               # Environment variables (not tracked in git)
├── .gitignore        # Git ignore configuration
├── next.config.js    # Next.js configuration
├── package.json      # Project dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── yarn.lock         # Yarn dependency lock file
```

## Getting Started

1. **Prerequisites**
   - Node.js (LTS version recommended)
   - Yarn package manager

2. **Installation**

   ```bash
   # Clone the repository
   git clone [repository-url]

   # Install dependencies
   yarn install
   ```

3. **Development**

   ```bash
   # Start development server
   yarn dev
   ```

   The development server will start at `http://localhost:3000`

4. **Build**

   ```bash
   # Create production build
   yarn build

   # Start production server
   yarn start
   ```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Add your environment variables here
```

## Development Guidelines

- Follow TypeScript best practices
- Use component-based architecture
- Implement responsive design principles
- Follow accessibility guidelines
- Write clean, maintainable code with proper documentation

## Deployment

The project is configured for deployment on Vercel. Simply connect your repository to Vercel for automatic deployments on every push to the main branch.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add License Information]

## Contact

[Add Contact Information]

## Data Structure

### Competition Data Model

- Event information
- Participant details
- Results and scoring
- Photo album links
- Competition categories and levels

### User Roles

- Administrators
- Competition Officials
- Dancers/Competitors
- Formation Teams
- Public Users

---
*This website serves as the official platform for the Hungarian DanceSport community, providing comprehensive tools for competition management and result tracking.*
