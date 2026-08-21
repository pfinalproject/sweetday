from io import BytesIO

from PIL import Image

TAMANO_MAXIMO = 800  # px, lado mas largo
CALIDAD_JPEG = 82


def redimensionar_imagen(imagen_bytes: bytes) -> bytes:
    """Reduce cualquier foto a un JPEG razonable (maximo 800px de lado, calidad 82).

    Sin esto, una foto de celular de varios MB / alta resolucion se guardaba y se
    procesaba tal cual: cada GET /foto transmitia el archivo completo, y calcular el
    embedding implicaba decodificar la imagen entera en memoria antes de que el
    modelo la redujera internamente. Con catalogos de varias fotos, servir varias a
    la vez (ej. la tabla de Productos, que las carga todas juntas) sumaba memoria
    suficiente para tumbar el proceso en el tier gratuito de Render (512MB).
    """
    imagen = Image.open(BytesIO(imagen_bytes))
    imagen = imagen.convert("RGB")
    imagen.thumbnail((TAMANO_MAXIMO, TAMANO_MAXIMO))
    buffer = BytesIO()
    imagen.save(buffer, format="JPEG", quality=CALIDAD_JPEG)
    return buffer.getvalue()
