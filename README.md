# KitchenFlow

Proyecto académico de la materia **Aplicaciones Web Escalables (224501)** de la **Universidad Autónoma de San Luis Potosí (UASLP)**.

Autor: **Miguel Alejandro Gutiérrez Silva**  
Programa: Ingeniería en Computación  
Semestre: **10mo semestre**

## Idea general del proyecto

**KitchenFlow** es una propuesta de sistema para control operativo y financiero de cafeterías. La aplicación integra módulos de:

- Recetas y costeo.
- Producción y mermas.
- Abastecimiento con costo promedio ponderado (WAC).
- Ventas en piso.
- Dashboard de rentabilidad con KPIs.

La idea central es conectar inventario, producción y ventas para tener trazabilidad de costos y apoyar la toma de decisiones.

## UI y componentes

La interfaz frontend usa un sistema de componentes **inspirado en ZardUI**, implementado localmente dentro del proyecto (no como dependencia npm externa):

- Referencia visual y de API: https://zardui.com/
- Componentes base reutilizables (`z-button`, `z-card`, `z-badge`, `z-input`, `z-table`) definidos en `frontend/src/app/shared/components/`.

## Estructura del repositorio

```text
.
├── backend/                  # API Node.js/Express
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # App Angular (interfaz KitchenFlow)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy-selfhosted.yml  # CI/CD simple para deploy
├── docker-compose.yml        # Orquestación de servicios
├── propuesta/                # Documento y material de propuesta (LaTeX, diagramas, mockups)
└── clase-ejemplo/            # Material auxiliar de clase
```

## Contenedores y deployment

El proyecto está planteado con contenedores Docker para facilitar el despliegue y la portabilidad entre entornos.

- Se usa `docker-compose.yml` para levantar servicios.
- El frontend se expone en el puerto `4200` dentro del servidor.
- Nginx publica la app bajo la ruta `/awe/`.

Esto simplifica la puesta en marcha en VPS y reduce diferencias entre desarrollo y servidor.

## CI/CD simple

Se implementó un flujo básico de CI/CD con GitHub Actions en un **runner self-hosted**:

- Archivo: `.github/workflows/deploy-selfhosted.yml`
- Disparador: `push` a la rama `master` (y ejecución manual con `workflow_dispatch`).
- Acción principal: reconstruir y levantar el servicio frontend con Docker Compose.
- Incluye una verificación de salud (`health check`) contra `http://127.0.0.1:4200/awe/`.

## Diagramas Mermaid

### Flujo funcional de KitchenFlow

```mermaid
flowchart LR
    A[Abastecimiento\nRegistro de compra + WAC] --> B[Inventario de insumos actualizado]
    B --> C[Producción\nExplosión de materiales]
    C --> D[Stock de producto terminado]
    D --> E[Ventas en piso]
    E --> F[Dashboard de rentabilidad]

    R[Recetas y costeo] --> C
    R --> F
    M[Mermas] --> F

    classDef supply fill:#fff3e6,stroke:#d97706,stroke-width:2px,color:#7c2d12;
    classDef inventory fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#083344;
    classDef ops fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#3b0764;
    classDef sales fill:#ecfccb,stroke:#65a30d,stroke-width:2px,color:#365314;
    classDef analytics fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#1e1b4b;
    classDef support fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#831843;

    class A supply;
    class B inventory;
    class C,D ops;
    class E sales;
    class F analytics;
    class R,M support;

    linkStyle default stroke:#7c4a2d,stroke-width:2px;
```

### Flujo de CI/CD (simple)

```mermaid
flowchart TB
    DEV[Push a master] --> GA[GitHub Actions\nDeploy on self-hosted runner]
    GA --> CO[Checkout del repositorio]
    CO --> FIX[Fix ownership del workspace]
    FIX --> DEPLOY[Docker Compose\nup -d --build frontend]
    DEPLOY --> HC[Health check\n/awe/]
    HC -->|OK| LIVE[Deploy activo en VPS]
    HC -->|Falla| LOGS[Imprime logs y falla el job]
    LIVE --> URL[http://51.222.28.32/awe/]

    classDef trigger fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#7c2d12;
    classDef pipeline fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef deploy fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#0c4a6e;
    classDef success fill:#ecfdf3,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef failure fill:#fef2f2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef endpoint fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;

    class DEV trigger;
    class GA,CO,FIX pipeline;
    class DEPLOY,HC deploy;
    class LIVE success;
    class LOGS failure;
    class URL endpoint;

    linkStyle default stroke:#2563eb,stroke-width:2px;
    linkStyle 5 stroke:#16a34a,stroke-width:3px;
    linkStyle 6 stroke:#dc2626,stroke-width:3px;
```

## URL de revisión

La versión desplegada puede revisarse en:

**http://51.222.28.32/awe/**
