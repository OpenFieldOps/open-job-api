# OpenInter Backend

## Getting Started

To get started with this backend:

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
make db-start
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
