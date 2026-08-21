"""Script standalone: calcula el embedding de UNA imagen y lo imprime como JSON.

Se ejecuta como subproceso aparte (ver embeddings.py) para que la memoria que usa
ONNX Runtime al cargar el modelo se libere de inmediato al terminar, en vez de
quedar retenida para siempre en el proceso principal de la API.
"""
import json
import sys

from fastembed import ImageEmbedding

MODELO = "Qdrant/resnet50-onnx"


def main() -> None:
    ruta_imagen = sys.argv[1]
    modelo = ImageEmbedding(model_name=MODELO, threads=1, enable_cpu_mem_arena=False)
    vector = next(modelo.embed([ruta_imagen]))
    print(json.dumps(vector.tolist()))


if __name__ == "__main__":
    main()
