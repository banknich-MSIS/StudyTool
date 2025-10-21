from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routes import files as files_routes
from .routes import concepts as concepts_routes
from .routes import exam as exam_routes
from .routes import dashboard as dashboard_routes
from .routes import classes as classes_routes


def create_app() -> FastAPI:
    app = FastAPI(title="Hoosier Prep Portal API", version="0.1.0")

    # CORS for Vite dev server
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(files_routes.router, prefix="/api")
    app.include_router(concepts_routes.router, prefix="/api")
    app.include_router(exam_routes.router, prefix="/api")
    app.include_router(dashboard_routes.router, prefix="/api")
    app.include_router(classes_routes.router, prefix="/api")

    @app.on_event("startup")
    def _startup() -> None:
        # Create tables on startup for local dev
        Base.metadata.create_all(bind=engine)

    return app


app = create_app()


