# PrintHub3D — atajos de instalación y operación

SHELL := /bin/bash
ADMIN_EMAIL ?= admin@global3d.com

.PHONY: help install dev build seed admin up down logs backup test

help:
	@echo "make install   -> instala dependencias de backend y frontend"
	@echo "make dev       -> levanta backend + frontend en modo desarrollo"
	@echo "make seed      -> crea settings iniciales (necesita Mongo corriendo)"
	@echo "make admin     -> crea el usuario admin (ADMIN_EMAIL=... make admin)"
	@echo "make up        -> docker compose de producción (usa .env.prod)"
	@echo "make down      -> baja el compose de producción"
	@echo "make backup    -> backup manual de Mongo a ./backups"
	@echo "make test      -> tests del backend"

install:
	cd backend && npm ci
	cd frontend && npm ci

dev:
	npm run dev

build:
	cd backend && npm run build
	cd frontend && npm run build

seed:
	cd backend && npm run seed:settings

admin:
	cd backend && npm run create:admin -- --email $(ADMIN_EMAIL)

up:
	docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

down:
	docker compose -f docker-compose.prod.yml down

logs:
	docker compose -f docker-compose.prod.yml logs -f --tail=100

backup:
	@mkdir -p backups
	docker compose -f docker-compose.prod.yml exec -T mongodb \
	  mongodump --uri="mongodb://localhost:27017/global3d" --archive --gzip \
	  > backups/global3d-$$(date +%Y%m%d-%H%M%S).archive.gz
	@echo "backup guardado en ./backups"

test:
	cd backend && npm test
