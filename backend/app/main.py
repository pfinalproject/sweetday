from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    asistente,
    auth,
    categorias,
    compras,
    productos,
    proveedores,
    reportes,
    turnos_caja,
    usuarios,
    ventas,
)
from app.core.config import settings

app = FastAPI(title="SweetDay API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(proveedores.router)
app.include_router(usuarios.router)
app.include_router(turnos_caja.router)
app.include_router(ventas.router)
app.include_router(compras.router)
app.include_router(reportes.router)
app.include_router(asistente.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
