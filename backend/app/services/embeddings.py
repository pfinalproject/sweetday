import json
import subprocess
import sys
import tempfile
from pathlib import Path

WORKER = Path(__file__).parent / "embeddings_worker.py"


def calcular_embedding(imagen_bytes: bytes) -> list[float]:
    """Calcula el embedding en un proceso aparte, de corta duracion: al terminar, el
    sistema operativo libera toda su memoria (~250-300MB del modelo) de inmediato.

    Evita que el proceso principal de la API quede con la RAM elevada de forma
    permanente despues de la primera foto — sin esto, el proceso de FastAPI subia
    de ~160MB a ~420MB y se quedaba ahi para siempre, muy cerca del limite de 512MB
    del tier gratuito de Render/Koyeb. Con esto, el proceso principal se mantiene
    en ~160MB y solo el subproceso (efimero) sube durante el par de segundos que
    tarda en procesar cada foto.
    """
    with tempfile.NamedTemporaryFile(suffix=".jpg") as tmp:
        tmp.write(imagen_bytes)
        tmp.flush()
        resultado = subprocess.run(
            [sys.executable, str(WORKER), tmp.name],
            capture_output=True,
            text=True,
            timeout=60,
        )

    if resultado.returncode != 0:
        raise RuntimeError(f"Fallo el calculo del embedding: {resultado.stderr[-500:]}")

    return json.loads(resultado.stdout)
