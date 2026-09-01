from io import BytesIO

from PIL import Image, UnidentifiedImageError

TAMANO_MAXIMO = 800  # px, lado mas largo
CALIDAD_JPEG = 82
FORMATOS_PERMITIDOS = {"JPEG", "PNG", "WEBP"}


def redimensionar_imagen(imagen_bytes: bytes) -> bytes:
    """Reduce cualquier foto a un JPEG razonable (maximo 800px de lado, calidad 82).

    Sin esto, una foto de celular de varios MB / alta resolucion se guardaba y se
    procesaba tal cual: cada GET /foto transmitia el archivo completo, y calcular el
    embedding implicaba decodificar la imagen entera en memoria antes de que el
    modelo la redujera internamente. Con catalogos de varias fotos, servir varias a
    la vez (ej. la tabla de Productos, que las carga todas juntas) sumaba memoria
    suficiente para tumbar el proceso en el tier gratuito de Render (512MB).

    La validacion real de que el archivo es una imagen ocurre aca, decodificando el
    contenido con Pillow -- el Content-Type que manda el navegador es solo una
    sugerencia del cliente y cualquiera puede falsificarlo (ej. subir un script con
    Content-Type: image/png), asi que no alcanza como control de seguridad.
    """
    try:
        imagen = Image.open(BytesIO(imagen_bytes))
        imagen.load()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValueError("El archivo no es una imagen JPEG, PNG o WEBP valida") from exc

    if imagen.format not in FORMATOS_PERMITIDOS:
        raise ValueError("El archivo no es una imagen JPEG, PNG o WEBP valida")

    imagen = imagen.convert("RGB")
    imagen.thumbnail((TAMANO_MAXIMO, TAMANO_MAXIMO))
    buffer = BytesIO()
    imagen.save(buffer, format="JPEG", quality=CALIDAD_JPEG)
    return buffer.getvalue()
