#!/bin/bash

DB_HOST=localhost
DB_PORT=5432
DB_NAME=devdb
DB_USER=devuser

export PGPASSWORD="devpass"


psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q -Atc "
DO \$\$
DECLARE
    obj RECORD;
BEGIN
    FOR obj IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(obj.tablename) || ' CASCADE';
    END LOOP;
    FOR obj IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(obj.viewname) || ' CASCADE';
    END LOOP;
    FOR obj IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(obj.sequencename) || ' CASCADE';
    END LOOP;
    FOR obj IN (
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE specific_schema = 'public'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(obj.routine_name) || ' CASCADE';
    END LOOP;
    FOR obj IN (SELECT typname FROM pg_type WHERE typnamespace = '2200' AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(obj.typname) || ' CASCADE';
    END LOOP;
END
\$\$;
" > /dev/null 2>&1

