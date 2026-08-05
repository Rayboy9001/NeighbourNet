# Neighbour Fix

NeighbourNet — Full Lovable Build Prompt

Create a modern responsive web application called NeighbourNet.

Product Overview

NeighbourNet is a community problem-reporting platform that allows residents to report, discover, and track local issues in their neighbourhood.

The app should make reporting problems fast and simple while encouraging communities to work together to improve their surroundings.

Core idea:

"See it. Report it. Fix it together."

The platform should feel like a combination of:

 Google Maps (location-based discovery)

 Reddit (community interaction)

 Trello (status tracking)

 Modern mobile apps (simple UX)

Target Users

The main users are:

Residents

People who want to:

 Report problems

 See nearby issues

 Confirm existing reports

 Track repairs

Community leaders

People who want to:

 Understand common problems

 Monitor unresolved issues

Design Style

Create a clean, modern, friendly interface.

Visual Style

Use:

 White background

 Blue primary colour (#2563EB style)

 Green for completed issues

 Yellow for ongoing issues

 Red for urgent issues

 Rounded cards

 Soft shadows

 Large readable text

 Simple icons

The app should feel trustworthy and easy enough for someone who is not very technical.

Avoid:

 Complicated navigation

 Too many buttons

 Crowded screens

Navigation

Create a bottom navigation bar on mobile and sidebar on desktop.

Navigation items:

🏠 Home

🗺 Map

➕ Report

🔔 Notifications

👤 Profile

Home Dashboard

The home screen should show:

Header

"Good morning, [username]"

Small subtitle:

"Help improve your neighbourhood today."

Quick Actions

Large buttons:

 Report an Issue

View Nearby Problems

My Reports

Trending Issues

Display popular reports nearby.

Example cards:

🚧 Large pothole on Riverside Road

Category:
Road Damage

Status:
🟡 In Progress

Confirmed:
32 people

💡 Broken streetlight near Central Park

Category:
Electricity

Status:
🔴 Needs Attention

Confirmed:
18 people

Report Issue System

Create a simple step-by-step reporting process.

Step 1: Select Category

Options:

🚧 Roads

💡 Electricity

🚰 Water

🗑 Waste

🌳 Environment

🚨 Safety

🐕 Animals

Other

Step 2: Add Details

Fields:

Title

Example:
"Broken streetlight near school entrance"

Description

Photo upload

Step 3: Location

Allow users to:

 Use current location

 Select location manually on map

Step 4: Submit

Show confirmation:

"Your report has been submitted successfully."

Community Feed

Create a social-style feed.

Users can:

 View reports

 Confirm issues

 Comment

 Share

Each post contains:

 Image

 Title

 Description

 Category

 Location

 Date

 Status

 Confirmation count

Map Feature

Create an interactive map.

Display issue markers.

Marker colours:

🔴 Red:
Unresolved

🟡 Yellow:
Being handled

🟢 Green:
Fixed

Clicking a marker opens the report.

Report Tracking

Every issue should have a progress tracker.

Example:

Report Created
↓
Community Verified
↓
Assigned
↓
Being Fixed
↓
Resolved

User Profiles

Users have:

Profile picture

Name

Community points

Reports created

Issues confirmed

Achievements

Example:

🏅 Community Helper

⭐ 500 points

Gamification

Add a simple points system.

Users earn points for:

Creating useful reports

Confirming accurate issues

Helping verify problems

Badges:

First Reporter

Helpful Neighbour

Problem Solver

Community Champion

Search and Filters

Users should be able to filter reports by:

Category

Distance

Status

Date

Popularity

Backend Requirements

Use:

 Supabase authentication

 Supabase database

 Supabase storage for images

Database tables:

Users

Reports

Comments

Confirmations

Notifications

Database Fields

Users

id

name

email

avatar

points

created_at

Reports

id

user_id

title

description

category

image_url

latitude

longitude

status

created_at

Comments

id

report_id

user_id

message

created_at

Confirmations

id

report_id

user_id

created_at

MVP Limitations

Focus on these features first:

✅ Authentication

✅ Create reports

✅ Upload images

✅ Map view

✅ Community feed

✅ Confirm reports

✅ Status tracking

✅ User profiles

Do NOT add yet:

 Government dashboard

 AI image recognition

 Payments

 Advanced analytics

Final Goal

Create a polished MVP that feels like a real social impact startup product.

Prioritise:

 Ease of use

 Clean UI

 Fast reporting

 Community interaction

 Mobile-first experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/abc4e36f-76de-4d20-b67c-c37f23f947d9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
