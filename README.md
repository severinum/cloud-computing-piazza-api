# Cloud Computing Piazza Api
API for Piazza - Cloud Computing module API

## Environment Variables

Environmnet variables should be placed in

- `.env` file
- `.env.local` file

Required properties in a file:

- `PORT` example: PORT=3000

- `MURL` example MURL=mongo_atlas_connection_url_here

- `TOKEN_SECRET` example: TOKEN_SECRET=abcdefghijklmnopqrstuvwxyz1234567890

- `TOKEN_EXPIRY_TIME` example: TOKEN_EXPIRY_TIME="10d"

## Deployment

API is deployed to GCP VP as well as to GCP K8S cluster. URLs should be availabe in the report sent for marking. 