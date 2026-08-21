from pydantic import BaseModel, Field


class PreguntaEntrada(BaseModel):
    pregunta: str = Field(min_length=1, max_length=500)


class RespuestaAsistente(BaseModel):
    respuesta: str
