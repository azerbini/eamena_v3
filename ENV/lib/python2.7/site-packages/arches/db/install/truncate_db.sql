SELECT pg_terminate_backend(pid) from pg_stat_activity where datname='arches_eamena';
SELECT pg_terminate_backend(pid) from pg_stat_activity where datname='template_postgis_20';

DROP DATABASE IF EXISTS arches_eamena;

CREATE DATABASE arches_eamena
  WITH ENCODING='UTF8'
       OWNER=postgres
       TEMPLATE=template_postgis_20
       CONNECTION LIMIT=-1;

