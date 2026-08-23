"""Validadores de campos de texto reutilizados por varios schemas."""
import re

NOMBRE_PATTERN = re.compile(r"^[\w\sÀ-ÿ.,&'()/-]+$", re.UNICODE)
TELEFONO_PATTERN = re.compile(r"^[\d\s()+-]+$")


def validar_nombre(valor: str) -> str:
    valor = valor.strip()
    if not valor:
        raise ValueError("El nombre no puede estar vacío")
    if len(valor) > 120:
        raise ValueError("El nombre no puede superar los 120 caracteres")
    if not NOMBRE_PATTERN.match(valor):
        raise ValueError("El nombre contiene símbolos no permitidos")
    return valor


def validar_nombre_opcional(valor: str | None) -> str | None:
    if valor is None or not valor.strip():
        return None
    return validar_nombre(valor)


def validar_telefono(valor: str | None) -> str | None:
    if valor is None or not valor.strip():
        return None
    valor = valor.strip()
    if len(valor) > 30 or not TELEFONO_PATTERN.match(valor):
        raise ValueError("El teléfono solo puede contener dígitos, espacios, +, - y paréntesis")
    return valor
