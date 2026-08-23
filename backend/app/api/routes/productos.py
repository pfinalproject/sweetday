from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_usuario_actual, requiere_rol
from app.db.session import get_db
from app.models.producto import Producto
from app.models.usuario import RolUsuario
from app.schemas.producto import ProductoCrear, ProductoReconocido, ProductoSalida
from app.services.embeddings import calcular_embedding
from app.services.imagenes import redimensionar_imagen

router = APIRouter(prefix="/api/productos", tags=["productos"])

TIPOS_IMAGEN_PERMITIDOS = {"image/jpeg", "image/png", "image/webp"}
LIMITE_TAMANO_BYTES = 8 * 1024 * 1024  # 8MB


def _validar_imagen(archivo: UploadFile) -> None:
    if archivo.content_type not in TIPOS_IMAGEN_PERMITIDOS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La imagen debe ser JPEG, PNG o WEBP")


@router.get("", response_model=list[ProductoSalida], dependencies=[Depends(get_usuario_actual)])
def listar(activo: bool = True, db: Session = Depends(get_db)):
    return (
        db.query(Producto)
        .options(joinedload(Producto.categoria), joinedload(Producto.proveedor))
        .filter(Producto.activo.is_(activo))
        .order_by(Producto.nombre)
        .all()
    )


@router.get(
    "/codigo/{codigo_barras}",
    response_model=ProductoSalida,
    dependencies=[Depends(get_usuario_actual)],
)
def buscar_por_codigo(codigo_barras: str, db: Session = Depends(get_db)):
    """Usado por el escaner de la app (ZXing) al detectar un codigo de barras."""
    producto = (
        db.query(Producto)
        .options(joinedload(Producto.categoria), joinedload(Producto.proveedor))
        .filter(Producto.codigo_barras == codigo_barras)
        .first()
    )
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return producto


@router.post("/reconocer", response_model=list[ProductoReconocido], dependencies=[Depends(get_usuario_actual)])
async def reconocer(archivo: UploadFile = File(...), db: Session = Depends(get_db)):
    """Reconocimiento visual: recibe una foto tomada con la camara y devuelve los
    productos del catalogo mas parecidos, ordenados por similitud (sin codigo de barras).
    """
    _validar_imagen(archivo)
    datos = await archivo.read()
    if len(datos) > LIMITE_TAMANO_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La imagen no puede pesar mas de 8MB")

    datos_optimizados = redimensionar_imagen(datos)
    vector = calcular_embedding(datos_optimizados)
    distancia = Producto.embedding.cosine_distance(vector).label("distancia")

    filas = (
        db.query(Producto, distancia)
        .options(joinedload(Producto.categoria), joinedload(Producto.proveedor))
        .filter(Producto.activo.is_(True), Producto.embedding.isnot(None))
        .order_by(distancia)
        .limit(5)
        .all()
    )

    return [
        ProductoReconocido(
            producto=ProductoSalida.model_validate(producto),
            similitud_pct=round(max(0.0, 1 - float(dist)) * 100, 1),
        )
        for producto, dist in filas
    ]


@router.post(
    "",
    response_model=ProductoSalida,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def crear(datos: ProductoCrear, db: Session = Depends(get_db)):
    producto = Producto(**datos.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.put(
    "/{producto_id}",
    response_model=ProductoSalida,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def actualizar(producto_id: str, datos: ProductoCrear, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    for campo, valor in datos.model_dump().items():
        setattr(producto, campo, valor)
    db.commit()
    db.refresh(producto)
    return producto


@router.post(
    "/{producto_id}/foto",
    response_model=ProductoSalida,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
async def subir_foto(producto_id: str, archivo: UploadFile = File(...), db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    _validar_imagen(archivo)

    datos = await archivo.read()
    if len(datos) > LIMITE_TAMANO_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La imagen no puede pesar mas de 8MB")

    datos_optimizados = redimensionar_imagen(datos)
    producto.imagen_datos = datos_optimizados
    producto.imagen_mime = "image/jpeg"
    producto.embedding = calcular_embedding(datos_optimizados)
    db.commit()
    db.refresh(producto)
    return producto


@router.get("/{producto_id}/foto")
def obtener_foto(producto_id: str, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if producto is None or producto.imagen_datos is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Este producto no tiene foto")
    return Response(content=producto.imagen_datos, media_type=producto.imagen_mime or "image/jpeg")


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requiere_rol(RolUsuario.ADMIN))],
)
def desactivar(producto_id: str, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    producto.activo = False
    db.commit()
