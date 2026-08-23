"""Crea la cuenta inicial de Admin si todavia no existe ningun usuario.

Uso: python -m app.seed
"""

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.usuario import RolUsuario, Usuario


def run():
    db = SessionLocal()
    try:
        if db.query(Usuario).count() > 0:
            print("Ya existen usuarios, no se crea ninguno nuevo.")
            return

        admin = Usuario(
            nombre="Administradora",
            email="duena@sweetday.com",
            hash_password=hash_password("cambiar123"),
            rol=RolUsuario.ADMIN,
        )
        db.add(admin)
        db.commit()
        print(f"Usuario Admin creado: {admin.email} / cambiar123 (cambiar en el primer ingreso)")
    finally:
        db.close()


if __name__ == "__main__":
    run()
