# OpenInter Backend

## Getting Started

To get started with this backend:

## Installation setup

### Linux / MacOS

## Install required components

```bash
  curl -H "Cache-Control: no-cache"  -fsSL 'https://raw.githubusercontent.com/OpenFieldOps/open-job-api/refs/heads/main/scripts/components.sh' | bash
```

### Install the backend

```bash
  curl -H "Cache-Control: no-cache"  -fsSL 'https://raw.githubusercontent.com/OpenFieldOps/open-job-api/refs/heads/main/scripts/install.sh' | bash
```

## Development Setup

### Setup Requirements

- Bun: [bun website](https://bun.sh/)
- Docker [docker website](https://www.docker.com/)
- Make: [make website](https://www.gnu.org/software/make/)

### Setup ".env" file

- rename the `.env.example` file to `.env`
- fill in the required environment variables
- you can use the `.env.example` file as a reference

### Setup database

```bash
make compose-up
make db-migrate
```

### Run the application

```bash
make api-install
make api-start
```

### Run the database studio

```bash
make db-studio
```

### Run the tests

```bash
bun test
```

### Run the lint

```bash
bun run lint
```

### Create dummy data

```bash
make api-dummy-data
```
