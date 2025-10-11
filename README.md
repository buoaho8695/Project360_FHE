# Project360_FHE

A privacy-focused platform enabling confidential 360-degree feedback collection within project teams using Full Homomorphic Encryption (FHE). Team members submit encrypted evaluations of each other's collaboration, and project managers only see aggregated, secure results.

## Project Background

Traditional 360-degree feedback systems face challenges with privacy, honesty, and bias:

• Fear of retaliation: Employees may hesitate to provide honest feedback if identities are exposed
• Centralized control: Managers may influence or access individual feedback prematurely
• Data aggregation issues: Difficulty in compiling meaningful insights without compromising privacy
• Lack of trust: Team members often distrust that their input remains confidential

Project360_FHE addresses these concerns by leveraging FHE to allow computations on encrypted feedback, providing project managers with accurate team performance metrics while preserving the confidentiality of individual inputs.

## Features

### Core Functionality

• **Encrypted Feedback Submission**: Team members submit evaluations in encrypted form.
• **Aggregated Analytics**: FHE-based aggregation provides overall performance and collaboration metrics.
• **Team Performance Dashboard**: Visualize aggregate scores, collaboration trends, and areas for improvement.
• **Anonymous Access**: Individual identities remain hidden; only encrypted data is processed.
• **Custom Metrics**: Supports multiple evaluation dimensions such as communication, accountability, and teamwork.

### Privacy & Security

• **Client-side Encryption**: Feedback is encrypted before leaving the user's device.
• **Immutable Records**: Submitted feedback cannot be altered or deleted.
• **Encrypted Processing**: Aggregation and analysis occur entirely on encrypted data.
• **Zero Knowledge Insights**: Project managers gain actionable insights without exposing individual responses.

## Architecture

### Backend Processing

• **FHE Computation Engine**: Processes encrypted feedback to generate aggregate metrics.
• **Database**: Stores encrypted submissions securely.
• **API Layer**: Provides authenticated access to aggregated reports.

### Frontend Application

• **React + TypeScript**: Interactive, responsive UI for submission and dashboard.
• **Visualization Tools**: Charts and tables for performance metrics.
• **User Authentication**: Optional login to manage projects while preserving anonymity of feedback.
• **Real-time Updates**: Dashboard reflects latest aggregated data securely.

## Technology Stack

### Backend

• **FHE Libraries**: Enables encrypted computation on client data.
• **Node.js**: Backend server and API management.
• **Database**: Secure storage for encrypted data.

### Frontend

• **React 18 + TypeScript**: Modern, responsive UI.
• **Charting Libraries**: For displaying aggregated metrics.
• **Tailwind CSS**: Styling and layout.

## Installation

### Prerequisites

• Node.js 18+
• npm / yarn / pnpm

### Setup

1. Clone the repository.
2. Install dependencies: `npm install`
3. Configure environment variables for backend API.
4. Start the development server: `npm run dev`

## Usage

• **Submit Feedback**: Team members enter evaluations in encrypted form.
• **View Aggregate Reports**: Project managers access dashboards with FHE-processed metrics.
• **Analyze Trends**: Track collaboration improvements and areas needing attention.

## Security Features

• **End-to-End Encryption**: Feedback remains encrypted from submission to aggregation.
• **FHE Processing**: Aggregate calculations performed without decrypting individual inputs.
• **Data Privacy by Design**: No personally identifiable information exposed.
• **Audit Logs**: All submissions logged for integrity without compromising confidentiality.

## Roadmap / Future Enhancements

• **Expanded Metrics**: Add new collaboration and performance dimensions.
• **Cross-Project Aggregation**: Analyze trends across multiple projects while maintaining privacy.
• **Mobile-Optimized Interface**: Enhance accessibility for team members on mobile devices.
• **AI Insights**: Integrate privacy-preserving AI analytics for predictive team performance suggestions.
• **Integration with HR Systems**: Seamlessly connect with existing organizational tools for anonymized reporting.

Built with ❤️ to foster secure, private, and actionable 360-degree feedback within project teams.
